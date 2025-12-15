
import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function POST(req) {
    try {
        const { budget } = await req.json();
        const numericBudget = Number(budget);

        if (!numericBudget || numericBudget < 100) {
            return NextResponse.json({ error: 'Invalid budget. Minimum 100.' }, { status: 400 });
        }

        // 1. Deduct Shipping (30 NIS) and Reverse-Calculate the 15% Discount
        // Formula: (TotalBudget - Shipping) = DiscountedItemsPrice
        // DiscountedItemsPrice = RealItemsPrice * 0.85
        // RealItemsPrice = (TotalBudget - 30) / 0.85
        const targetAmount = (numericBudget - 30) / 0.85;

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

        // Expand candidates into Size Variants (2ml, 5ml, 10ml)
        let expandedCandidates = [];
        for (const item of allCandidates) {
            // 2ml
            if (item.price_2ml > 0) {
                expandedCandidates.push({
                    ...item,
                    original_id: item.id,
                    id: `${item.id}-2`, // Unique ID for React keys
                    price: Number(item.price_2ml),
                    size: '2'
                });
            }
            // 5ml
            if (item.price_5ml > 0) {
                expandedCandidates.push({
                    ...item,
                    original_id: item.id,
                    id: `${item.id}-5`,
                    price: Number(item.price_5ml),
                    size: '5'
                });
            }
            // 10ml
            if (item.price_10ml > 0) {
                expandedCandidates.push({
                    ...item,
                    original_id: item.id,
                    id: `${item.id}-10`,
                    price: Number(item.price_10ml),
                    size: '10'
                });
            }
        }

        // Filter for budget in JS using the expanded items with known prices
        const candidates = expandedCandidates.filter(item => item.price <= targetAmount);

        // Fallback or Normal Flow
        let bestBundle = [];
        let bestSum = 0;

        if (candidates.length === 0) {
            // Fallback: Pick the absolute cheapest item available
            const cheapest = expandedCandidates.sort((a, b) => a.price - b.price)[0];

            if (cheapest) {
                bestBundle = [cheapest];
                bestSum = cheapest.price;
            } else {
                return NextResponse.json({ success: false, message: 'No products available in lottery pool.' });
            }
        } else {
            // Normal Logic: Randomized Greedy
            const MAX_ITERATIONS = 2000;
            for (let i = 0; i < MAX_ITERATIONS; i++) {
                let currentBundle = [];
                let currentSum = 0;

                // Shuffle candidates
                const shuffled = [...candidates].sort(() => 0.5 - Math.random());

                for (const item of shuffled) {
                    const price = item.price;

                    if (currentSum + price <= targetAmount) {
                        currentBundle.push(item);
                        currentSum += price;
                    }
                }

                if (currentSum > bestSum) {
                    bestSum = currentSum;
                    bestBundle = currentBundle;
                }

                // If we are very close to target (within 5 NIS), stop early (optimization)
                if (targetAmount - currentSum < 5) break;
            }

            // Failsafe: if greedy somehow failed but we have candidates (unlikely with loop, but possible if math weird)
            if (bestBundle.length === 0 && candidates.length > 0) {
                const cheapest = candidates.sort((a, b) => a.price - b.price)[0];
                bestBundle = [cheapest];
                bestSum = cheapest.price;
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
