import { NextResponse } from 'next/server';
import client from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const res = await client.query(`SELECT value FROM site_settings WHERE key = 'maintenance_mode'`);
        if (res.rows.length > 0) {
            return NextResponse.json({ enabled: !!res.rows[0].value?.enabled });
        }
        return NextResponse.json({ enabled: false });
    } catch (err) {
        console.error('Failed to get maintenance mode:', err);
        return NextResponse.json({ enabled: false });
    }
}
