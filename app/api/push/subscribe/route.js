import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { auth } from '@clerk/nextjs/server';

// Lazy table creation
async function ensureTable() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
            id SERIAL PRIMARY KEY,
            user_id TEXT,
            subscription JSONB NOT NULL,
            user_agent TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(subscription)
        );
        CREATE INDEX IF NOT EXISTS idx_push_user ON push_subscriptions(user_id);
    `);
}

export async function POST(req) {
    try {
        const { subscription, userAgent } = await req.json();

        if (!subscription || !subscription.endpoint) {
            return NextResponse.json({ error: 'Invalid subscription' }, { status: 400 });
        }

        const { userId } = await auth();
        await ensureTable();

        // Save or update subscription
        // Using ON CONFLICT with JSONB requires a unique index or specific logic.
        // We'll check existence first to keep it simple and portable.
        const existing = await pool.query(
            'SELECT id FROM push_subscriptions WHERE subscription = $1',
            [JSON.stringify(subscription)]
        );

        if (existing.rows.length === 0) {
            await pool.query(
                'INSERT INTO push_subscriptions (user_id, subscription, user_agent) VALUES ($1, $2, $3)',
                [userId || null, JSON.stringify(subscription), userAgent || null]
            );
        } else if (userId && !existing.rows[0].user_id) {
            // Update associate user_id if it was guest before
            await pool.query(
                'UPDATE push_subscriptions SET user_id = $1 WHERE id = $2',
                [userId, existing.rows[0].id]
            );
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Push Subscribe Error:', error);
        return NextResponse.json({ error: 'Failed to subscribe' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { subscription } = await req.json();
        if (!subscription) return NextResponse.json({ error: 'Missing subscription' }, { status: 400 });

        await pool.query(
            'DELETE FROM push_subscriptions WHERE subscription = $1',
            [JSON.stringify(subscription)]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Push Unsubscribe Error:', error);
        return NextResponse.json({ error: 'Failed to unsubscribe' }, { status: 500 });
    }
}
