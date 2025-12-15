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

export async function POST(req) {
    try {
        const body = await req.json();
        const { code, discount_percent, expires_in_hours, email } = body;

        if (!code || !discount_percent) {
            return NextResponse.json({ error: 'Missing Required Fields' }, { status: 400 });
        }

        // Calculate expiration if provided
        let expires_at = null;
        if (expires_in_hours) {
            expires_at = new Date(Date.now() + expires_in_hours * 60 * 60 * 1000);
        }

        const client = await pool.connect();
        try {
            await client.query(`
                INSERT INTO coupons (code, discount_percent, expires_at, status, email)
                VALUES ($1, $2, $3, 'active', $4)
            `, [code, discount_percent, expires_at, email || null]);

            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Create Coupon Error:', error);
        if (error.code === '23505') { // Unique violation
            return NextResponse.json({ error: 'קוד קופון כבר קיים' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Failed to create' }, { status: 500 });
    }
}
