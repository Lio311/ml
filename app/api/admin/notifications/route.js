import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    let client;
    try {
        client = await pool.connect();
        const res = await client.query(`
            SELECT * FROM notifications 
            ORDER BY created_at DESC 
            LIMIT 10
        `);

        const countRes = await client.query(`
            SELECT COUNT(*) FROM notifications WHERE is_read = FALSE
        `);

        return NextResponse.json({
            notifications: res.rows,
            unreadCount: parseInt(countRes.rows[0].count)
        });
    } catch (err) {
        console.error("Notifications fetch error:", err);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}
