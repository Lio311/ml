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
        // Reserve 30 NIS for shipping as requested
        const shippingCost = 30;
        let userBudget = parseInt(budget) - shippingCost;

        // Safety check: ensure decent budget remains
        if (userBudget < 50) userBudget = parseInt(budget); // Fallback if budget is really low

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

        // Strategy Update: Instead of just "Cheapest" (Price ASC), we target the "Average Budget Per Item".
        // This prevents the system from picking very cheap items when the user has a high budget.
        const targetPrice = userBudget / requestedQty;

        // Sort by Score DESC, then by closeness to Target Price
        candidates.sort((a, b) => {
            if (b.score !== a.score) return b.score - a.score; // Higher score first
            // If scores equal, pick the one closer to the target price
            return Math.abs(a.price - targetPrice) - Math.abs(b.price - targetPrice);
        });

        // Ensure Uniqueness (just in case DB returns dupes, though likely distinct by ID)
        // We do this by keeping a Set of IDs
        const uniqueCandidates = [];
        const seenIds = new Set();
        for (const c of candidates) {
            if (!seenIds.has(c.id)) {
                uniqueCandidates.push(c);
                seenIds.add(c.id);
            }
        }
        candidates = uniqueCandidates;

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


        // Optimization 2: Upgrade if under budget (Upsell)
        // If we are significantly under budget (e.g. < 90%), try to swap cheap items for better/more expensive ones
        // Goal: Get closer to userBudget without exceeding it.
        // We only consider upgrading if we have room.
        if (currentTotal < userBudget * 0.95) {
            // Remaining candidates that are NOT currently selected
            const remaining = candidates.slice(requestedQty).filter(r => !selected.find(s => s.id === r.id));

            // Sort remaining by Score DESC then Price DESC (Best quality/price to fill gap)
            remaining.sort((a, b) => {
                if (b.score !== a.score) return b.score - a.score;
                return b.price - a.price;
            });

            let upgradesPossible = true;
            while (currentTotal < userBudget && upgradesPossible) {
                // Try to replace the cheapest selected item to make the biggest impact or fine tune?
                // Strategy: Replace cheapest selected with something more expensive that fits.

                selected.sort((a, b) => a.price - b.price); // Cheapest first
                const cheapest = selected[0];

                // Find an upgrade in remaining:
                // 1. Price > Cheapest (to increase total)
                // 2. (Total - Cheapest + New) <= Budget
                const upgrade = remaining.find(r =>
                    r.price > cheapest.price &&
                    (currentTotal - cheapest.price + r.price) <= userBudget
                );

                if (upgrade) {
                    // Perform Swap
                    selected.shift(); // Remove cheapest
                    selected.push(upgrade);

                    // Update lists
                    const idx = remaining.indexOf(upgrade);
                    if (idx > -1) remaining.splice(idx, 1);

                    currentTotal = selected.reduce((sum, p) => sum + p.price, 0);
                } else {
                    upgradesPossible = false;
                }
            }
        }

        // Final Check
        let message = "";
        if (currentTotal > userBudget) {
            message = `התקציב היה נמוך מדי למארז זה, הגענו הכי קרוב שאפשר (${currentTotal} ₪)`;
        } else if (currentTotal < userBudget * 0.8) {
            message = `מצאנו מארז מעולה במחיר משתלם במיוחד! (${currentTotal} ₪)`;
        } else {
            message = "בול בתקציב! מארז מושלם עבורך.";
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
