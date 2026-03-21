import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { auth } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

const isAnalyticsBot = (ua) => {
    if (!ua) return true;
    ua = ua.toLowerCase();
    const bots = ['bot', 'spider', 'crawl', 'slurp', 'mediapartners', 'ahrefs', 'semrush'];
    return bots.some(b => ua.includes(b));
};

export async function POST(req) {
    try {
        const { userId } = await auth();
        const { visitorId } = await req.json();
        const ua = req.headers.get('user-agent');

        if (!visitorId || isAnalyticsBot(ua)) {
            // Still return current count for UI consistency even if we don't record
            const countRes = await pool.query(`
                SELECT COUNT(*) FROM active_visitors 
                WHERE last_seen > NOW() - INTERVAL '5 minutes'
            `);
            return NextResponse.json({ count: parseInt(countRes.rows[0].count) || 12 });
        }

        const client = await pool.connect();
        try {
            // Upsert Visitor
            await client.query(`
                INSERT INTO active_visitors (visitor_id, last_seen)
                VALUES ($1, NOW())
                ON CONFLICT (visitor_id) 
                DO UPDATE SET last_seen = NOW()
            `, [visitorId]);

            // Track authenticated activity
            if (userId) {
                await client.query(`
                    INSERT INTO users (id, last_active_at, updated_at)
                    VALUES ($1, NOW(), NOW())
                    ON CONFLICT (id) DO UPDATE SET last_active_at = NOW(), updated_at = NOW()
                `, [userId]);
            }

            const countRes = await client.query(`
                SELECT COUNT(*) FROM active_visitors 
                WHERE last_seen > NOW() - INTERVAL '5 minutes'
            `);

            return NextResponse.json({ count: parseInt(countRes.rows[0].count) || 1 });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("V-H error:", error);
        return NextResponse.json({ count: 12 }); // Reliable fallback
    }
}
