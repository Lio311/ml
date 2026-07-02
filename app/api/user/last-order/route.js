import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '@/app/lib/db';
import * as Sentry from "@sentry/nextjs";

export async function GET(req) {
    try {
        const authData = await auth();
        const userId = authData?.userId;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            // Find the most recent order for this user that has an address
            const res = await client.query(`
                SELECT customer_details->>'address' as address
                FROM orders
                WHERE customer_details->>'clerk_id' = $1
                  AND customer_details->>'address' IS NOT NULL
                ORDER BY created_at DESC
                LIMIT 1
            `, [userId]);

            if (res.rows.length > 0 && res.rows[0].address) {
                return NextResponse.json({ address: JSON.parse(res.rows[0].address) });
            }

            return NextResponse.json({ address: null });
        } finally {
            client.release();
        }
    } catch (error) {
        Sentry.captureException(error);
        console.error('Error fetching last order:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
