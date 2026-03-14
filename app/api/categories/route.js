import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET() {
    let client;
    try {
        client = await pool.connect();

        // Fetch unique categories from the main products table
        // Categories are stored as comma-separated values, so we split and deduplicate
        const res = await client.query(`
            SELECT DISTINCT trim(unnest(string_to_array(category, ','))) as cat
            FROM products
            WHERE category IS NOT NULL AND category != ''
            ORDER BY cat ASC
        `);

        const categories = res.rows.map(row => row.cat).filter(c => c && c.length > 0);

        return NextResponse.json(categories);
    } catch (error) {
        console.error('Error fetching categories:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}
