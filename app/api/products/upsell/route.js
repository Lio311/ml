import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    const client = await pool.connect();
    try {
        // Fetch 10 random active products
        const res = await client.query(`
            SELECT id, name, brand, model, image_url, price_2ml, price_5ml, price_10ml, stock 
            FROM products 
            WHERE stock > 0
            ORDER BY RANDOM() 
            LIMIT 10
        `);
        return NextResponse.json(res.rows);
    } catch (error) {
        console.error('Upsell API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
