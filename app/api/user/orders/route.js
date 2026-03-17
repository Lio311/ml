import { NextResponse } from 'next/server';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import pool from '../../../lib/db';

export async function GET() {
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT o.*, 
                       EXISTS(SELECT 1 FROM reviews r WHERE r.order_id = o.id) as has_review
                FROM orders o
                WHERE o.customer_details->>'clerk_id' = $1
                ORDER BY o.created_at DESC
            `, [userId]);

            return NextResponse.json({ orders: res.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Fetch Orders Error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
