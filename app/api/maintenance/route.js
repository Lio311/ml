import { NextResponse } from 'next/server';
import client from '@/app/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
    const headers = {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
    };

    try {
        const res = await client.query(`SELECT value FROM site_settings WHERE key = 'maintenance_mode'`);
        if (res.rows.length > 0) {
            let enabled = false;
            try {
                const parsed = JSON.parse(res.rows[0].value);
                enabled = !!parsed?.enabled;
            } catch (e) {}
            return NextResponse.json({ enabled }, { headers });
        }
        return NextResponse.json({ enabled: false }, { headers });
    } catch (err) {
        console.error('Failed to get maintenance mode:', err);
        return NextResponse.json({ enabled: false }, { headers });
    }
}
