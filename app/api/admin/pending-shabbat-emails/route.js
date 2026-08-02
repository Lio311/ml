import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    const client = await pool.connect();
    try {
        const { searchParams } = new URL(req.url);
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const countResult = await client.query('SELECT COUNT(*) FROM queued_shabbat_emails WHERE status = $1', ['pending']);
        const total = parseInt(countResult.rows[0].count);

        const query = `
            SELECT id, recipient, subject, type, created_at, order_id, campaign_id, status
            FROM queued_shabbat_emails
            WHERE status = $1
            ORDER BY created_at DESC
            LIMIT $2 OFFSET $3
        `;
        const result = await client.query(query, ['pending', limit, offset]);

        return NextResponse.json({
            emails: result.rows,
            total,
            page: Math.floor(offset / limit) + 1,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error('Error fetching pending shabbat emails:', error);
        return NextResponse.json({ error: 'Failed to fetch pending shabbat emails' }, { status: 500 });
    } finally {
        client.release();
    }
}
