import { NextResponse } from 'next/server';
import pool from '../../lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            const res = await client.query('SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != \'\' ORDER BY brand ASC');
            // Map to expected format { id, name } or just name
            // The UI expects an array of objects with 'name' property based on "b.name" access.
            const brands = res.rows.map(r => ({ id: r.brand, name: r.brand }));
            return NextResponse.json(brands);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Brands Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
