import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function POST(req) {
    try {
        const { email, items } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // Upsert: Insert or Update if exists
            await client.query(`
                INSERT INTO abandoned_carts (email, items, updated_at, recovery_status)
                VALUES ($1, $2, NOW(), 'pending')
                ON CONFLICT (email) 
                DO UPDATE SET 
                    items = EXCLUDED.items,
                    updated_at = NOW(),
                    recovery_status = 'pending';
            `, [email, JSON.stringify(items)]);

            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Cart Sync Error:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
