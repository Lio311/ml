import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';
export async function POST(req) {
    let userId = null;
    try {
        const authData = await auth();
        userId = authData.userId;
    } catch (e) {
        // Ignored
    }

    try {
        const { excludedIds } = await req.json();
        const excluded = Array.isArray(excludedIds) ? excludedIds : [];

        let recommendations = [];
        const client = await pool.connect();

        try {
            // 1. Wishlist (If logged in)
            if (userId) {
                const wishlistRes = await client.query(`
                    SELECT p.id, p.name, p.brand, p.model, p.image_url, p.price_2ml, p.price_5ml, p.price_10ml, p.stock
                    FROM wishlist w
                    JOIN products p ON w.product_id = p.id
                    WHERE w.user_id = $1 AND p.stock > 0
                `, [userId]);

                // Filter out excluded
                const wishlistItems = wishlistRes.rows.filter(p => !excluded.includes(p.id));
                recommendations.push(...wishlistItems);
                // console.log(`[Upsell] Wishlist items found: ${wishlistItems.length}`);
            }

            // 2. History (Today) (If logged in and need more items)
            if (userId && recommendations.length < 3) {
                // console.log(`[Upsell] Fetching history... Slots remaining: ${3 - recommendations.length}`);
                try {
                    const historyRes = await client.query(`
                        SELECT DISTINCT ON (p.id) p.id, p.name, p.brand, p.model, p.image_url, p.price_2ml, p.price_5ml, p.price_10ml, p.stock
                        FROM product_views v
                        JOIN products p ON v.product_id::text = p.id::text
                        WHERE v.user_id = $1 
                        AND v.viewed_at > NOW() - INTERVAL '24 hours' -- Last 24 hours
                        AND p.stock > 0
                        ORDER BY p.id, v.viewed_at DESC
                    `, [userId]);

                    const historyItems = historyRes.rows.filter(p =>
                        !excluded.includes(p.id) &&
                        !recommendations.some(r => r.id === p.id) // Not already in recommendations
                    );
                    // console.log(`[Upsell] History items found: ${historyItems.length}`);
                    recommendations.push(...historyItems);
                } catch (err) {
                    console.warn("History fetch failed (table likely missing), skipping:", err.message);
                }
            }

            // 3. Random Fallback (Fill up to 3)
            if (recommendations.length < 3) {
                const limit = 3 - recommendations.length;
                // Get more than needed to ensure we can filter out exclusions in app if SQL exclusion is tricky or just huge exclusion list
                // For SQL we can do NOT IN if list is small, or just fetch random 10 and filter.

                // Construct basic exclusion list for SQL (current recommendations + cart)
                const currentRecIds = recommendations.map(r => r.id);
                const allExcluded = [...excluded, ...currentRecIds];

                // Postgres NOT IN requires non-empty list
                let notInClause = "";
                let params = [];
                if (allExcluded.length > 0) {
                    notInClause = `AND id NOT IN (${allExcluded.map((_, i) => `$${i + 1}`).join(',')})`;
                    params = allExcluded;
                }

                const randomRes = await client.query(`
                    SELECT id, name, brand, model, image_url, price_2ml, price_5ml, price_10ml, stock 
                    FROM products 
                    WHERE stock > 0 ${notInClause}
                    ORDER BY RANDOM() 
                    LIMIT 3
                `, params);

                recommendations.push(...randomRes.rows);
            }

            // Limit final result to 3 unique items
            recommendations = recommendations.slice(0, 3);

            return NextResponse.json(recommendations);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Upsell API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
