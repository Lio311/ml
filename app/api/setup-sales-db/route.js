import { NextResponse } from 'next/server';
import pool from '../../lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS product_sales (
                    product_id INTEGER PRIMARY KEY,
                    sales_count INTEGER DEFAULT 0,
                    last_updated TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);
            return NextResponse.json({ message: 'Sales table created successfully' });
        } finally {
            client.release();
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
