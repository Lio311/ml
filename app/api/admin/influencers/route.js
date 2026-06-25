import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

export async function GET() {
    const isAdmin = await checkAdmin({ allowViewer: true });
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const res = await pool.query(`
            SELECT 
                i.*, 
                c.code as coupon_code,
                (SELECT COUNT(*) FROM orders o WHERE o.coupon_code = c.code) as usage_count,
                (SELECT SUM(total_amount - (CASE WHEN delivery_method IN ('mail', 'shipping') THEN COALESCE((customer_details->>'shipping_cost')::numeric, 30) ELSE 0 END)) 
                 FROM orders o WHERE o.coupon_code = c.code) as total_sales
            FROM influencers i
            LEFT JOIN coupons c ON c.influencer_id = i.id
            ORDER BY i.name ASC;
        `);
        return NextResponse.json(res.rows);
    } catch (error) {
        console.error("GET Influencers Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { name, base_salary, commission_percent } = await req.json();
        if (!name) return NextResponse.json({ error: "Name is required" }, { status: 400 });

        const res = await pool.query(
            'INSERT INTO influencers (name, base_salary, commission_percent) VALUES ($1, $2, $3) RETURNING *',
            [name, base_salary || 0, commission_percent || 0]
        );
        return NextResponse.json(res.rows[0]);
    } catch (error) {
        console.error("POST Influencer Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
