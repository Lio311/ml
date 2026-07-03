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
            // Fetch the user's saved address from the users table
            // This ensures manual updates via the Admin panel are reflected in the cart
            const res = await client.query(`
                SELECT address
                FROM users
                WHERE id = $1 OR email = (SELECT email FROM users WHERE id = $1 LIMIT 1)
                LIMIT 1
            `, [userId]);

            if (res.rows.length > 0 && res.rows[0].address) {
                let addr = res.rows[0].address;
                if (typeof addr === 'string') {
                    try { addr = JSON.parse(addr); } catch(e) {}
                }
                return NextResponse.json({ address: addr });
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
