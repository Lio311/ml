import { NextResponse } from 'next/server';
import client from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const res = await client.query('SELECT * FROM site_settings');
        return NextResponse.json({ rows: res.rows });
    } catch (e) {
        return NextResponse.json({ error: e.message });
    }
}
