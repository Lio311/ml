
import { NextResponse } from 'next/server';
import pool from '../../lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            await client.query('ALTER TABLE products ADD COLUMN IF NOT EXISTS in_lottery BOOLEAN DEFAULT TRUE');
            return NextResponse.json({ success: true, message: 'Column added' });
        } finally {
            client.release();
        }
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
