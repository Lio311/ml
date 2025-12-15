import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT * FROM coupons 
                ORDER BY created_at DESC 
                LIMIT 50
            `);
            return NextResponse.json(res.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Admin Coupons Error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
