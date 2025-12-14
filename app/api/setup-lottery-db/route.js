
import { NextResponse } from 'next/server';
import pool from '../../lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            // 1. Add Column if missing
            await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS in_lottery BOOLEAN DEFAULT TRUE');

            // 2. Populate Pool: Force update all in-stock products to be in lottery
            await client.query('UPDATE products SET in_lottery = true WHERE stock > 0');

            return NextResponse.json({ success: true, message: 'Column added and Pool Populated with all stock.' });
        } finally {
            client.release();
        }
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
