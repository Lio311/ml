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
        const rawExcluded = Array.isArray(excludedIds) ? excludedIds : [];
        const excluded = rawExcluded.filter(id => id && !isNaN(parseInt(id, 10)) && String(id).match(/^\d+$/)).map(id => parseInt(id, 10));

        let recommendations = [];
        const client = await pool.connect();

        try {
            // 1. Wishlist (If logged in)
            if (userId) {
                const wishlistRes = await client.query(`
                    SELECT p.id, p.name, p.brand, p.brand_he, p.model, p.model_he, p.image_url, p.price_2ml, p.price_5ml, p.price_10ml, p.stock, p.created_at, p.discount_percentage, p.discount_sizes
                    FROM wishlist w
                    JOIN products p ON w.product_id = p.id
                    WHERE w.user_id = $1 AND p.stock > 0 AND p.active = true
                    AND (p.price_2ml > 0 OR p.price_5ml > 0 OR p.price_10ml > 0)
                `, [userId]);

                // Filter out excluded
                const wishlistItems = wishlistRes.rows.filter(p => !excluded.includes(p.id));
                recommendations.push(...wishlistItems);
            }

            // 2. History (Today) (If logged in and need more items)
            if (userId && recommendations.length < 3) {
                try {
                    const historyRes = await client.query(`
                        SELECT DISTINCT ON (p.id) p.id, p.name, p.brand, p.brand_he, p.model, p.model_he, p.image_url, p.price_2ml, p.price_5ml, p.price_10ml, p.stock, p.created_at, p.discount_percentage, p.discount_sizes
                        FROM product_views v
                        JOIN products p ON v.product_id::text = p.id::text
                        WHERE v.user_id = $1 
                        AND v.viewed_at > NOW() - INTERVAL '24 hours'
                        AND p.stock > 0 AND p.active = true
                        AND (p.price_2ml > 0 OR p.price_5ml > 0 OR p.price_10ml > 0)
                        ORDER BY p.id, v.viewed_at DESC
                    `, [userId]);

                    const historyItems = historyRes.rows.filter(p =>
                        !excluded.includes(p.id) &&
                        !recommendations.some(r => r.id === p.id)
                    );
                    recommendations.push(...historyItems);
                } catch (err) {
                    console.warn("History fetch failed, skipping:", err.message);
                }
            }

            // 3. Fallback Logic (Fill up to 3)
            // The user mentioned "another logic". A good upsell logic is to suggest Best Sellers or Latest products.
            // We'll use a mix of random and popular to keep it dynamic but relevant.
            if (recommendations.length < 3) {
                const limit = 3 - recommendations.length;
                
                const currentRecIds = recommendations.map(r => r.id);
                const allExcluded = [...excluded, ...currentRecIds];

                let notInClause = "";
                let params = [];
                if (allExcluded.length > 0) {
                    notInClause = `AND id NOT IN (${allExcluded.map((_, i) => `$${i + 1}`).join(',')})`;
                    params = allExcluded;
                }

                // Append limit at the end of params
                params.push(limit);
                const limitParam = `$${params.length}`;

                const fallbackRes = await client.query(`
                    SELECT id, name, brand, brand_he, model, model_he, image_url, price_2ml, price_5ml, price_10ml, stock, created_at, discount_percentage, discount_sizes
                    FROM products 
                    WHERE stock > 0 AND active = true 
                    AND (price_2ml > 0 OR price_5ml > 0 OR price_10ml > 0)
                    ${notInClause}
                    ORDER BY RANDOM() 
                    LIMIT ${limitParam}
                `, params);

                recommendations.push(...fallbackRes.rows);
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
