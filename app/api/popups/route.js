import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

// Public API — returns only enabled popups (no auth required)
export async function GET() {
    try {
        const res = await pool.query("SELECT value FROM site_settings WHERE key = 'site_popups'");

        if (res.rows.length > 0) {
            const allPopups = res.rows[0].value;
            const enabledPopups = Array.isArray(allPopups) ? allPopups.filter(p => p.enabled) : [];
            return NextResponse.json({ popups: enabledPopups });
        }

        return NextResponse.json({ popups: [] });
    } catch (error) {
        console.error('Public Popups Fetch Error:', error);
        return NextResponse.json({ popups: [] });
    }
}
