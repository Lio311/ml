import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import * as Sentry from "@sentry/nextjs";
import { getAuth } from '@clerk/nextjs/server'; // adjust to your actual auth check

export async function GET(req) {
    try {
        // Basic auth check using Clerk
        const { userId } = getAuth(req);
        // Add more robust admin validation here if needed
        if (!userId) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const client = await pool.connect();
        try {
            // Fetch carts updated within the last 24 hours
            const res = await client.query(`
                SELECT session_id, email, user_image, items, total_price, created_at, updated_at 
                FROM live_carts 
                WHERE updated_at > NOW() - INTERVAL '30 DAYS'
                ORDER BY updated_at DESC
                LIMIT 500
            `);
            
            return NextResponse.json({ carts: res.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        Sentry.captureException(error);
        console.error('Fetch Live Carts Error:', error);
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}
