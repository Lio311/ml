import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function POST(req) {
    try {
        const { code } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Code required' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT * FROM coupons 
                WHERE code = $1 
                AND status = 'active'
                AND (expires_at IS NULL OR expires_at > NOW())
            `, [code.toUpperCase()]);

            if (res.rows.length === 0) {
                return NextResponse.json({ error: 'Invalid or expired coupon' }, { status: 404 });
            }

            const coupon = res.rows[0];
            return NextResponse.json({
                success: true,
                discountPercent: coupon.discount_percent,
                code: coupon.code,
                limitations: coupon.limitations || {}
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Coupon Validation Error:', error);
        return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
    }
}
