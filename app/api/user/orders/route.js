import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '../../../lib/db';

export async function GET() {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT * FROM orders 
                WHERE clerk_id = $1 OR customer_details->>'clerk_id' = $1
                ORDER BY created_at DESC
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
