
import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function POST(req) {
    try {
        const { budget } = await req.json();
        const numericBudget = Number(budget);

        if (!numericBudget || numericBudget < 200) {
            return NextResponse.json({ error: 'Invalid budget. Minimum 200.' }, { status: 400 });
        }

        // 1. Deduct Shipping (30 NIS)
        const targetAmount = numericBudget - 30;

        const client = await pool.connect();
        let allCandidates = [];
        try {
            // Attempt 1: Fetch active products strict with lottery flag
            try {
                const res = await client.query(`
                    SELECT * FROM products 
                    WHERE stock > 0 
                    AND active = true
                    AND in_lottery = true
                `);
                allCandidates = res.rows;
            } catch (dbError) {
                // If column 'in_lottery' does not exist yet (migration skipped), fallback to all products
                console.warn("Lottery DB Query failed (likely missing column), falling back to all products:", dbError.message);
                const resFallback = await client.query(`
                    SELECT * FROM products 
                    WHERE stock > 0 
                    AND active = true
                `);
                allCandidates = resFallback.rows;
            }

            // Attempt 2: If we have NO candidates from lottery pool, broaden search to ALL products (Emergency Mode)
            // This ensures we never return empty if the store has products.
            if (allCandidates.length === 0) {
                const resAll = await client.query(`
                    SELECT * FROM products 
                    WHERE stock > 0 
                    AND active = true
                `);
                allCandidates = resAll.rows;
            }

        } finally {
            client.release();
        }

        // Filter for budget in JS
        const candidates = allCandidates.filter(item => Number(item.price) <= targetAmount);

        // Fallback or Normal Flow
        let bestBundle = [];
        let bestSum = 0;

        if (candidates.length === 0) {
            // If strictly no items fit the budget standard logic...
            // Fallback: Pick the absolute cheapest item available to at least offer something.
            // User said "System MUST be able to assemble".
            const cheapest = allCandidates.sort((a, b) => Number(a.price) - Number(b.price))[0];

            if (cheapest) {
                bestBundle = [cheapest];
                bestSum = Number(cheapest.price);
                // We accept that bestSum might be > targetAmount here significantly if target is very low.
            } else {
                return NextResponse.json({ success: false, message: 'No products available in lottery pool.' });
            }
        } else {
            // Normal Logic: Randomized Greedy
            const MAX_ITERATIONS = 2000;
            for (let i = 0; i < MAX_ITERATIONS; i++) {
                let currentBundle = [];
                let currentSum = 0;
                let usedBrands = new Set();

                const shuffled = [...candidates].sort(() => 0.5 - Math.random());

                for (const item of shuffled) {
                    const price = Number(item.price);

                    if (usedBrands.has(item.brand)) continue;

                    if (currentSum + price <= targetAmount) {
                        currentBundle.push(item);
                        currentSum += price;
                        usedBrands.add(item.brand);
                    }
                }

                if (currentSum > bestSum) {
                    bestSum = currentSum;
                    bestBundle = currentBundle;
                }
                if (targetAmount - currentSum < 5) break;
            }

            // Double check if we failed to pick anything from candidates
            if (bestBundle.length === 0 && candidates.length > 0) {
                // Should not happen if candidates exist, but purely safe fallback
                const cheapest = candidates.sort((a, b) => Number(a.price) - Number(b.price))[0];
                bestBundle = [cheapest];
                bestSum = Number(cheapest.price);
            }
        }

        return NextResponse.json({
            success: true,
            items: bestBundle,
            totalValue: bestSum,
            shippingDeducted: 30,
            targetForItems: targetAmount
        });

    } catch (error) {
        console.error('Lottery Generation Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
