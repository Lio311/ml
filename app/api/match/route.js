import pool from '../../lib/db';
import { NextResponse } from 'next/server';

export async function POST(request) {
    try {
        const { quantity, size, budget, notes } = await request.json();

        // Validate inputs
        if (!quantity || !size || !budget) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const requestedSize = parseInt(size);
        const requestedQty = parseInt(quantity);
        const userBudget = parseInt(budget);
        const userNotes = new Set(notes || []);

        // 1. Fetch Candidates
        // stock >= requestedSize (to ensure at least one unit per item)
        // We select dynamic price column based on size
        const priceCol = `price_${requestedSize}ml`;

        const query = `
            SELECT id, name, brand, active, stock, image_url, top_notes, middle_notes, base_notes, category, 
                   ${priceCol} as price 
            FROM products 
            WHERE active = true 
            AND stock >= $1
            AND ${priceCol} IS NOT NULL
            AND ${priceCol} > 0
        `;

        const res = await pool.query(query, [requestedSize]);
        let candidates = res.rows;

        if (candidates.length < requestedQty) {
            return NextResponse.json({
                error: "לא נמצאו מספיק בשמים במלאי התואמים את הגודל המבוקש.",
                products: [],
                totalPrice: 0
            }, { status: 200 }); // Return 200 to handle gracefully in UI
        }

        // 2. Score Candidates
        candidates = candidates.map(p => {
            const pNotes = new Set([
                ...(p.top_notes || '').split(',').map(n => n.trim()).filter(Boolean),
                ...(p.middle_notes || '').split(',').map(n => n.trim()).filter(Boolean),
                ...(p.base_notes || '').split(',').map(n => n.trim()).filter(Boolean)
            ]);

            // Intersection
            let intersection = 0;
            pNotes.forEach(note => {
                if (userNotes.has(note)) intersection++;
            });

            // Jaccard (optional, but intersection is often better for "hits" on preferences)
            // Let's use intersection count as primary score.
            // Tie-break with random to vary results?

            return {
                ...p,
                score: intersection,
                price: parseInt(p.price)
            };
        });

        // 3. Selection Algorithm (Greedy Knapsack-ish)
        // Goal: Maximize Score, Subject to Total Price <= Budget, Count == Quantity

        // A simple heuristic:
        // Filter out items that are individually way above budget? (Not necessarily, one expensive item is ok if others are cheap)

        // Sort by Score DESC, Price ASC
        candidates.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score; // Higher score first
            return a.price - b.price; // Lower price second (if scores equal)
        });

        // Take top Qty
        let selected = candidates.slice(0, requestedQty);
        let currentTotal = selected.reduce((sum, p) => sum + p.price, 0);

        // Optimization: If over budget, try to swap expensive items for cheaper ones from the remaining candidates
        if (currentTotal > userBudget) {
            const remaining = candidates.slice(requestedQty);
            // Sort remaining by price ASC to find cheapest replacements
            remaining.sort((a, b) => a.price - b.price);

            // While over budget and we have options
            // Try to replace the most expensive item in 'selected' with the cheapest in 'remaining'
            // IF it reduces the total cost.

            let improvementsPossible = true;
            while (currentTotal > userBudget && improvementsPossible) {
                // Find most expensive in selected
                selected.sort((a, b) => b.price - a.price);
                const mostExpensive = selected[0];

                // Find cheapest in remaining that is cheaper than mostExpensive
                const cheapestReplacement = remaining.find(r => r.price < mostExpensive.price);

                if (cheapestReplacement) {
                    // Swap
                    selected.shift(); // Remove first (most expensive)
                    selected.push(cheapestReplacement);

                    // Update pool (put expensive back? strictly speaking we don't need to if we just want *a* solution)
                    // Let's remove used replacement from remaining
                    const idx = remaining.indexOf(cheapestReplacement);
                    if (idx > -1) remaining.splice(idx, 1);

                    currentTotal = selected.reduce((sum, p) => sum + p.price, 0);
                } else {
                    improvementsPossible = false;
                }
            }
        }

        // Final Check
        // If still over budget, we might notify the user or just show it (sometimes impossible to fit)
        let message = "";
        if (currentTotal > userBudget) {
            message = `התקציב היה נמוך מדי למארז זה, הגענו הכי קרוב שאפשר (${currentTotal} ₪)`;
        } else {
            message = "נמצא מארז מושלם בתקציב!";
        }

        return NextResponse.json({
            products: selected.map(p => ({
                id: p.id,
                name: p.name,
                brand: p.brand,
                image_url: p.image_url,
                price: p.price
            })),
            totalPrice: currentTotal,
            message
        });

    } catch (error) {
        console.error("Match API Error:", error);
        return NextResponse.json({ error: "Server Error" }, { status: 500 });
    }
}
