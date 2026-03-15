import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            // Fetch top 3 catalogs ordered by number of orders. 
            // If they have 0 orders, it falls back to ordering by created_at.
            const res = await client.query(`
                SELECT 
                    c.id, 
                    c.name, 
                    c.slug, 
                    c.description,
                    COUNT(o.id) as order_count
                FROM user_catalogs c
                LEFT JOIN orders o ON c.id = o.catalog_id
                WHERE c.is_hidden IS FALSE OR c.is_hidden IS NULL
                GROUP BY c.id
                ORDER BY order_count DESC, c.created_at DESC
                LIMIT 3
            `);
            
            return NextResponse.json(res.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching top catalogs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
