import pool from '../../../lib/db';
import { auth, currentUser } from '@clerk/nextjs/server';
import { mapHebrewQuery } from '../../../lib/hebrewMapping';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        let query = searchParams.get('q'); // Query is let so we can modify

        if (!query || query.length < 2) {
            return NextResponse.json({ results: [] });
        }

        // Map Hebrew to English if applicable
        query = await mapHebrewQuery(query);

        const client = await pool.connect();
        try {
            // Search for products by name, brand, or model
            // Case insensitive (ILIKE)
            // Limit to 5 results for dropdown
            // Fuzzy search using pg_trgm similarity
            // Using a similarity threshold (e.g., > 0.2) or just order by similarity
            // It will handle typos like 'שנל' instead of 'שאנל'.
            const res = await client.query(`
                SELECT id, name, brand, model, image_url, price_2ml, price_5ml, price_10ml, stock, slug,
                discount_percentage, discount_sizes, discount_end_date,
                GREATEST(similarity(name, $1), similarity(brand, $1), similarity(model, $1), similarity(name_he, $1)) as sim_score
                FROM products 
                WHERE active = true 
                AND (
                    name ILIKE $2 
                    OR brand ILIKE $2 
                    OR model ILIKE $2
                    OR name_he ILIKE $2
                    OR similarity(name, $1) > 0.2
                    OR similarity(brand, $1) > 0.2
                    OR similarity(name_he, $1) > 0.2
                )
                ORDER BY 
                    sim_score DESC,
                    id DESC
                LIMIT 5
            `, [query, `%${query}%`]);

            const results = res.rows.map(product => {
                const isDiscountActive = (size) => {
                    if (!product.discount_percentage || product.discount_percentage <= 0) return false;
                    if (size) {
                        const sizeStr = `${size}ml`;
                        if (!(product.discount_sizes || []).includes(sizeStr)) return false;
                    }
                    if (product.discount_end_date && new Date(product.discount_end_date) < new Date()) return false;
                    return true;
                };

                const getDiscountedPrice = (size, originalPrice) => {
                    if (!originalPrice || isNaN(originalPrice)) return Infinity;
                    if (!isDiscountActive(size)) return Number(originalPrice);
                    return Math.round((Number(originalPrice) * (1 - product.discount_percentage / 100)) / 5) * 5;
                };

                const minPrice = Math.min(
                    getDiscountedPrice(2, product.price_2ml),
                    getDiscountedPrice(5, product.price_5ml),
                    getDiscountedPrice(10, product.price_10ml)
                );

                return {
                    id: product.id,
                    slug: product.slug,
                    name: product.name,
                    brand: product.brand,
                    image: product.image_url,
                    price_2ml: product.price_2ml,
                    price_5ml: product.price_5ml,
                    price_10ml: product.price_10ml,
                    discount_percentage: product.discount_percentage,
                    discount_sizes: product.discount_sizes,
                    discount_end_date: product.discount_end_date,
                    price: minPrice === Infinity ? 0 : minPrice,
                    original_min_price: Math.min(
                        Number(product.price_2ml) || Infinity,
                        Number(product.price_5ml) || Infinity,
                        Number(product.price_10ml) || Infinity
                    ),
                    stock: product.stock
                };
            });

            // --- Log Search Query (Background) ---
            (async () => {
                try {
                    const authData = await auth();
                    const user = await currentUser();
                    const userId = authData?.userId;
                    const userEmail = user?.emailAddresses?.[0]?.emailAddress;
                    
                    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
                    const ua = req.headers.get('user-agent') || 'unknown';
                    const platform = req.headers.get('sec-ch-ua-platform') || 'unknown';

                    const logClient = await pool.connect();
                    try {
                        await logClient.query(`
                            INSERT INTO search_logs (query, results_count, user_id, user_email, ip_address, user_agent, platform)
                            VALUES ($1, $2, $3, $4, $5, $6, $7)
                        `, [query, results.length, userId || null, userEmail || null, ip, ua, platform]);
                    } finally {
                        logClient.release();
                    }
                } catch (logError) {
                    console.error('Failed to log search query:', logError);
                }
            })();
            // -------------------------------------

            return NextResponse.json({ results });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Autocomplete Search Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
