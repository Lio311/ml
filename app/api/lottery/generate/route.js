
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
        let candidates = [];
        try {
            // Fetch ALL active products with stock.
            // We want diversity, so we fetch everything and filter in code if needed.
            // We prioritize items that "make sense" for a lottery (e.g. not 1000 NIS items if budget is 500).
            // But checking <= targetAmount is a good basic filter.
            const res = await client.query(`
                SELECT * FROM products 
                WHERE price > 0 AND price <= $1
                AND stock > 0 
                AND is_active = true
            `, [targetAmount]);
            candidates = res.rows;
        } finally {
            client.release();
        }

        if (candidates.length === 0) {
            // Fallback: This effectively means no products under the budget exist.
            return NextResponse.json({ success: false, message: 'No products available within budget' });
        }

        // 2. Algorithm to find Best Bundle
        // Goal: Sum(prices) <= targetAmount (and close to it)
        // Check: Unique Brand

        // We'll run multiple iterations of a randomized greedy approach.

        let bestBundle = [];
        let bestSum = 0;

        // Allow slightly exceeding? User said "If 470, 450 is fine". 
        // He implies "close to 470 from below" is definitely fine.
        // What about "close from above"? Usually people get angry if they pay MORE than budget.
        // So we strictly cap at `budget` (inclusive of shipping) -> `sum <= targetAmount`.
        // Or maybe `sum <= numericBudget`.
        // Let's stick to: Try to hit `targetAmount`. If we get 450 for 470, good.
        // We will NOT exceed `targetAmount + 5` (small buffer?) No, let's keep it safe: <= Target.

        const MAX_ITERATIONS = 1000; // Fast enough for JS

        for (let i = 0; i < MAX_ITERATIONS; i++) {
            let currentBundle = [];
            let currentSum = 0;
            let usedBrands = new Set();

            // Shuffle candidates
            const shuffled = [...candidates].sort(() => 0.5 - Math.random());

            for (const item of shuffled) {
                const price = Number(item.price);

                // Check Brand constraints
                if (usedBrands.has(item.brand)) continue;

                // Check Budget constraint
                if (currentSum + price <= targetAmount) {
                    currentBundle.push(item);
                    currentSum += price;
                    usedBrands.add(item.brand);
                }
            }

            // Update best
            if (currentSum > bestSum) {
                bestSum = currentSum;
                bestBundle = currentBundle;
            }

            // If we are VERY close (e.g. within 5 NIS), stop early
            if (targetAmount - currentSum < 5) break;
        }

        // 3. Validation
        // If bestSum is too low (e.g. < 50% of budget), maybe user won't like it?
        // But "System MUST be able to assemble". So providing *something* is better than nothing.
        // Unless it's empty.
        if (bestBundle.length === 0) {
            // Fallback: Try to find at least ONE item that fits
            const cheapest = candidates.sort((a, b) => Number(a.price) - Number(b.price))[0];
            if (cheapest && Number(cheapest.price) <= targetAmount) {
                bestBundle = [cheapest];
                bestSum = Number(cheapest.price);
            } else {
                return NextResponse.json({ success: false, message: 'Could not form a valid bundle even with single item.' });
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
