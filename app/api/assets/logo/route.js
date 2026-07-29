import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { DEFAULT_LOGOS } from '@/app/api/admin/logo/route';

export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type') || 'logo_header';

    // Validate type against allowed keys (plus site_logo for backward compatibility)
    if (!Object.keys(DEFAULT_LOGOS).includes(type) && type !== 'site_logo') {
        return new NextResponse('Invalid logo type', { status: 400 });
    }

    try {
        const client = await pool.connect();
        try {
            // Check table exists (we might not need to strictly do this on every asset fetch, but safe)
            await client.query(`
                CREATE TABLE IF NOT EXISTS site_settings (
                    id SERIAL PRIMARY KEY,
                    key VARCHAR(255) UNIQUE NOT NULL,
                    value JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // If requesting site_logo or logo_header, fetch both just in case
            let queryKey = type;
            let res;
            if (type === 'logo_header' || type === 'site_logo') {
                res = await client.query("SELECT key, value FROM site_settings WHERE key IN ('site_logo', 'logo_header')");
                const headerRow = res.rows.find(r => r.key === 'logo_header');
                const siteRow = res.rows.find(r => r.key === 'site_logo');
                
                const logoUrl = headerRow?.value?.url || siteRow?.value?.url || DEFAULT_LOGOS.logo_header;
                return NextResponse.redirect(new URL(logoUrl, req.url));
            } else {
                res = await client.query("SELECT value FROM site_settings WHERE key = $1", [type]);
                const logoUrl = res.rows.length > 0 ? res.rows[0].value?.url : DEFAULT_LOGOS[type];
                return NextResponse.redirect(new URL(logoUrl, req.url));
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Asset Logo GET error:', error);
        // Fallback to default
        const fallback = DEFAULT_LOGOS[type === 'site_logo' ? 'logo_header' : type];
        return NextResponse.redirect(new URL(fallback, req.url));
    }
}
