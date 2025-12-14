
import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function POST(req) {
    try {
        const { budget } = await req.json();
        const targetBudget = Number(budget);

        if (!targetBudget || targetBudget < 200 || targetBudget > 1000) {
            return NextResponse.json({ error: 'Invalid budget' }, { status: 400 });
        }

        const client = await pool.connect();
        let candidates = [];
        try {
            // Fetch potential "samples" or small items.
            // Assumption: Samples/Travel sizes are usually cheaper (e.g. < 150 NIS) OR explicitly named "Sample".
            // We'll fetch everything < 150 NIS for now to ensure variety.
            // Also ensure stock > 0.
            const res = await client.query(`
                SELECT * FROM products 
                WHERE price > 0 AND price <= 150 
                AND stock > 0 
                AND is_active = true
            `);
            candidates = res.rows;
        } finally {
            client.release();
        }

        if (candidates.length === 0) {
            return NextResponse.json({ success: false, message: 'No products available' });
        }

        // Bundle Generation Logic
        // Goal: Sum(prices) ≈ targetBudget
        // Constraint: Unique Brand

        // Multi-try approach to find best fit
        let bestBundle = [];
        let bestDiff = Infinity;

        for (let i = 0; i < 50; i++) { // Try 50 random combinations
            let currentBundle = [];
            let currentSum = 0;
            let usedBrands = new Set();

            // Shuffle candidates
            const shuffled = [...candidates].sort(() => 0.5 - Math.random());

            for (const item of shuffled) {
                if (usedBrands.has(item.brand)) continue; // Unique Brand Constraint

                // Heuristic: If adding this item keeps us under budget + 10%, take it.
                // Or "Exact Budget" means we stop when we exceed? 
                // "Fit exactly the budget".
                // Let's try to get as close as possible without exceeding significantly, or maybe exceeding is fine if it's "close enough" 
                // and we treat the price as fixed to the user's budget?
                // "The user chooses a budget... system fits the budget".
                // Usually implies the total value is >= budget, but user pays budget.
                // But wait, "The benefit is 15% discount". 
                // So the CART contents should sum to something close to budget, and then 15% off? 
                // OR user pays `budget` and gets `budget / 0.85` worth of goods?
                // "Benefit is 15% on the cart". This implies standard pricing minus 15%.
                // So the products should sum up to roughly the budget.

                if (currentSum + Number(item.price) <= targetBudget + 20) { // Allow slight overflow
                    currentBundle.push(item);
                    currentSum += Number(item.price);
                    usedBrands.add(item.brand);
                }
            }

            // Check diff
            const diff = Math.abs(targetBudget - currentSum);
            if (diff < bestDiff) {
                bestDiff = diff;
                bestBundle = currentBundle;
            }

            if (diff < 5) break; // Good enough
        }

        // If outcome is too poor (e.g. generated 200 vs 500), maybe fail?
        // We'll return what we found.

        return NextResponse.json({
            success: true,
            items: bestBundle,
            totalValue: bestBundle.reduce((sum, item) => sum + Number(item.price), 0)
        });

    } catch (error) {
        console.error('Lottery Generation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
