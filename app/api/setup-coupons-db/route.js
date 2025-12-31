import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

export async function GET() {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    try {
        const client = await pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS coupons (
                    id SERIAL PRIMARY KEY,
                    code TEXT UNIQUE NOT NULL,
                    discount_percent INTEGER NOT NULL,
                    expires_at TIMESTAMP,
                    status TEXT DEFAULT 'active',
                    email TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                );
            `);
            return NextResponse.json({ success: true, message: "Coupons table created" });
        } finally {
            client.release();
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
