import pool from '@/app/lib/db';
import * as Sentry from "@sentry/nextjs";

export async function POST(req) {
    try {
        const origin = req.headers.get('origin') || req.headers.get('referer');
        const host = req.headers.get('host');
        if (origin && !origin.includes(host)) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { email, items } = await req.json();

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // Upsert: Insert or Update if exists
            await client.query(`
                INSERT INTO abandoned_carts (email, items, updated_at, recovery_status)
                VALUES ($1, $2, NOW(), 'pending')
                ON CONFLICT (email) 
                DO UPDATE SET 
                    items = EXCLUDED.items,
                    updated_at = NOW(),
                    recovery_status = 'pending';
            `, [email, JSON.stringify(items)]);

            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        Sentry.captureException(error);
        console.error('Cart Sync Error:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const email = searchParams.get('email');

        if (!email) {
            return NextResponse.json({ error: 'Email required' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            const res = await client.query('SELECT items FROM abandoned_carts WHERE email = $1', [email]);
            if (res.rows.length === 0) {
                return NextResponse.json({ items: [] });
            }
            return NextResponse.json({ items: res.rows[0].items || [] });
        } finally {
            client.release();
        }
    } catch (error) {
        Sentry.captureException(error);
        console.error('Cart Fetch Error:', error);
        return NextResponse.json({ error: 'Fetch failed' }, { status: 500 });
    }
}
