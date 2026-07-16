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

        const { sessionId, email, items, totalPrice } = await req.json();

        if (!sessionId) {
            return NextResponse.json({ error: 'Session ID required' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            if (!items || items.length === 0) {
                // Delete the active cart if it's empty
                await client.query(`DELETE FROM live_carts WHERE session_id = $1`, [sessionId]);
            } else {
                // Upsert: Insert or Update if exists
                await client.query(`
                    INSERT INTO live_carts (session_id, email, items, total_price, updated_at)
                    VALUES ($1, $2, $3, $4, NOW())
                    ON CONFLICT (session_id) 
                    DO UPDATE SET 
                        email = EXCLUDED.email,
                        items = EXCLUDED.items,
                        total_price = EXCLUDED.total_price,
                        updated_at = NOW();
                `, [sessionId, email || null, JSON.stringify(items), totalPrice || 0]);
            }

            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        Sentry.captureException(error);
        console.error('Live Cart Sync Error:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
