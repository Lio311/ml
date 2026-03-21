import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import * as Sentry from "@sentry/nextjs";

export async function POST(req) {
    try {
        const origin = req.headers.get('origin') || req.headers.get('referer');
        const host = req.headers.get('host');
        if (origin && !origin.includes(host)) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { code, subtotal } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Code required' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // Lazy migration: Ensure limitations column exists
            try {
                await client.query('ALTER TABLE coupons ADD COLUMN IF NOT EXISTS limitations JSONB');
            } catch (e) { /* Ignore if already exists or fails for other reasons */ }

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
            const limitations = coupon.limitations || {};

            // Check Minimum Total
            if (limitations.min_total && subtotal < limitations.min_total) {
                return NextResponse.json({ 
                    error: `סכום מינימלי לשימוש בקופון זה הוא ${limitations.min_total} ₪`,
                    min_total: limitations.min_total
                }, { status: 400 });
            }

            return NextResponse.json({
                success: true,
                coupon: {
                    code: coupon.code,
                    discount_type: 'percent',
                    discount_value: coupon.discount_percent,
                    limitations: limitations
                }
            });
        } finally {
            client.release();
        }
    } catch (error) {
        Sentry.captureException(error);
        console.error('Coupon Validation Error:', error);
        return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
    }
}
