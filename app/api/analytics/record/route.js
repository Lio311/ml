import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function POST(req) {
    try {
        const { path } = await req.json();
        const client = await pool.connect();
        try {
            await client.query(
                'INSERT INTO site_visits (page_path) VALUES ($1)',
                [path || '/']
            );
            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Analytics Error:', error);
        return NextResponse.json({ error: 'Failed to record visit' }, { status: 500 });
    }
}
