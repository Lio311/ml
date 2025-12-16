import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const query = searchParams.get('q');

        if (!query || query.length < 2) {
            return NextResponse.json({ results: [] });
        }

        const client = await pool.connect();
        try {
            // Search for products by name, brand, or model
            // Case insensitive (ILIKE)
            // Limit to 5 results for dropdown
            const res = await client.query(`
                SELECT id, name, brand, model, image_url, price_2ml, price_5ml, price_10ml, stock
                FROM products 
                WHERE active = true 
                AND (
                    name ILIKE $1 
                    OR brand ILIKE $1 
                    OR model ILIKE $1
                    OR description ILIKE $1
                )
                ORDER BY 
                    CASE 
                        WHEN name ILIKE $1 THEN 1 
                        WHEN brand ILIKE $1 THEN 2 
                        ELSE 3 
                    END,
                    id DESC
                LIMIT 5
            `, [`%${query}%`]);

            const results = res.rows.map(product => ({
                id: product.id,
                name: product.name,
                brand: product.brand,
                image: product.image_url,
                price: Math.min(
                    Number(product.price_2ml) || Infinity,
                    Number(product.price_5ml) || Infinity,
                    Number(product.price_10ml) || Infinity
                ),
                stock: product.stock
            }));

            return NextResponse.json({ results });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Autocomplete Search Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
