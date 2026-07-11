import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export async function GET(request) {
    try {
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const emailParam = new URL(request.url).searchParams.get('email');

        if (!emailParam) {
            return NextResponse.json({ error: "Missing email" }, { status: 400 });
        }

        // Auth check
        if (role !== 'admin' && role !== 'deputy' && role !== 'viewer') {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            // 1. Fetch orders history
            const ordersRes = await client.query(`
                SELECT id, items, total_amount, status, created_at, delivery_method, customer_details, coupon_code
                FROM orders 
                WHERE (customer_details->>'email' = $1)
                AND catalog_id IS NULL 
                ORDER BY created_at DESC
            `, [emailParam]);

            const orders = ordersRes.rows;

            // Ensure address column exists
            await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address JSONB;`);

            // 2. Fetch user record (if registered)
            const userRes = await client.query(`
                SELECT id, first_name, last_name, email, secondary_email, phone, address, created_at, role
                FROM users 
                WHERE email = $1
            `, [emailParam]);

            const userProfile = userRes.rows[0] || null;

            // 3. Calculate LTV (Successful orders)
            const successfulOrders = orders.filter(o => o.status !== 'cancelled');
            const totalSpent = successfulOrders.reduce((acc, current) => acc + (parseFloat(current.total_amount) || 0), 0);
            const totalOrdersCount = successfulOrders.length;

            return NextResponse.json({
                profile: userProfile,
                orders: orders,
                stats: {
                    totalSpent,
                    totalOrdersCount,
                    cancelledOrdersCount: orders.length - totalOrdersCount
                }
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Failed to fetch customer history:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

