import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { currentUser } from '@clerk/nextjs/server';

// Lazy table creation
async function ensureTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS funnel_events (
            id SERIAL PRIMARY KEY,
            session_id TEXT NOT NULL,
            event_type TEXT NOT NULL,
            metadata JSONB DEFAULT '{}',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_funnel_session ON funnel_events(session_id);
        CREATE INDEX IF NOT EXISTS idx_funnel_event ON funnel_events(event_type);
        CREATE INDEX IF NOT EXISTS idx_funnel_created ON funnel_events(created_at);
    `);
}

// POST: Record a funnel event
export async function POST(req) {
    try {
        const { sessionId, eventType, metadata } = await req.json();

        if (!sessionId || !eventType) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const validEvents = ['page_visit', 'add_to_cart', 'checkout_started', 'order_completed'];
        if (!validEvents.includes(eventType)) {
            return NextResponse.json({ error: 'Invalid event type' }, { status: 400 });
        }

        await ensureTable();

        // Deduplicate: don't record the same event type twice per session
        // (except add_to_cart which can happen multiple times)
        if (eventType !== 'add_to_cart') {
            const existing = await pool.query(
                'SELECT id FROM funnel_events WHERE session_id = $1 AND event_type = $2 LIMIT 1',
                [sessionId, eventType]
            );
            if (existing.rows.length > 0) {
                return NextResponse.json({ success: true, deduplicated: true });
            }
        }

        await pool.query(
            'INSERT INTO funnel_events (session_id, event_type, metadata) VALUES ($1, $2, $3)',
            [sessionId, eventType, JSON.stringify(metadata || {})]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Funnel record error:', error);
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}

// GET: Fetch funnel data (Admin only)
export async function GET(req) {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    if (role !== 'admin' && role !== 'deputy') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        await ensureTable();

        const { searchParams } = new URL(req.url);
        const days = parseInt(searchParams.get('days') || '30');

        // Count unique sessions per funnel step
        const result = await pool.query(`
            SELECT 
                event_type,
                COUNT(DISTINCT session_id) as unique_sessions
            FROM funnel_events
            WHERE created_at >= NOW() - INTERVAL '${days} days'
            GROUP BY event_type
        `);

        const counts = {};
        result.rows.forEach(r => {
            counts[r.event_type] = parseInt(r.unique_sessions);
        });

        // Also get site_visits count for the same period (existing data)
        const visitsRes = await pool.query(`
            SELECT COUNT(*) FROM site_visits
            WHERE created_at >= NOW() - INTERVAL '${days} days'
        `);
        const siteVisits = parseInt(visitsRes.rows[0]?.count || 0);

        // Use the greater of site_visits or funnel page_visit
        const pageVisits = Math.max(siteVisits, counts['page_visit'] || 0);

        // Daily funnel breakdown for trend chart
        const dailyRes = await pool.query(`
            SELECT 
                DATE(created_at) as day,
                event_type,
                COUNT(DISTINCT session_id) as count
            FROM funnel_events
            WHERE created_at >= NOW() - INTERVAL '${days} days'
            GROUP BY day, event_type
            ORDER BY day
        `);

        // Build daily data
        const dailyMap = {};
        dailyRes.rows.forEach(r => {
            const dayStr = new Date(r.day).toISOString().split('T')[0];
            if (!dailyMap[dayStr]) dailyMap[dayStr] = {};
            dailyMap[dayStr][r.event_type] = parseInt(r.count);
        });

        const dailyData = Object.entries(dailyMap)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([date, events]) => ({
                date,
                add_to_cart: events['add_to_cart'] || 0,
                checkout_started: events['checkout_started'] || 0,
                order_completed: events['order_completed'] || 0
            }));

        return NextResponse.json({
            funnel: {
                page_visit: pageVisits,
                add_to_cart: counts['add_to_cart'] || 0,
                checkout_started: counts['checkout_started'] || 0,
                order_completed: counts['order_completed'] || 0
            },
            daily: dailyData,
            period: days
        });
    } catch (error) {
        console.error('Funnel fetch error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
