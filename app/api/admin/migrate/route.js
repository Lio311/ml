import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS expenses (
                id SERIAL PRIMARY KEY,
                description TEXT NOT NULL,
                amount NUMERIC NOT NULL,
                type VARCHAR(20) DEFAULT 'monthly', -- 'monthly' or 'yearly'
                date TIMESTAMP DEFAULT NOW(),
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);
        return NextResponse.json({ success: true, message: "Table created" });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    } finally {
        client.release();
    }
}
