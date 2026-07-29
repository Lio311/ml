import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

export const DEFAULT_LOGOS = {
    logo_header: '/logo_v5.png',
    logo_email: '/logo_v6.png',
    logo_chat: '/ml_CHAT.png',
    logo_fallback: '/logo_v3.png',
    icon_apple: '/apple-touch-icon.png',
    icon_192: '/icon-192.png',
    icon_512: '/icon-512.png',
    favicon: '/favicon.svg'
};

async function ensureTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS site_settings (
            id SERIAL PRIMARY KEY,
            key VARCHAR(255) UNIQUE NOT NULL,
            value JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            await ensureTable(client);
            const res = await client.query("SELECT key, value FROM site_settings WHERE key IN ('site_logo', 'logo_header', 'logo_email', 'logo_chat', 'logo_fallback', 'icon_apple', 'icon_192', 'icon_512', 'favicon')");
            
            let logos = { ...DEFAULT_LOGOS };
            let isDefault = Object.keys(DEFAULT_LOGOS).reduce((acc, key) => ({ ...acc, [key]: true }), {});
            
            res.rows.forEach(row => {
                let actualKey = row.key;
                if (actualKey === 'site_logo' && !res.rows.find(r => r.key === 'logo_header')) {
                    actualKey = 'logo_header';
                }
                if (DEFAULT_LOGOS[actualKey]) {
                    logos[actualKey] = row.value?.url || DEFAULT_LOGOS[actualKey];
                    isDefault[actualKey] = !row.value?.url;
                }
            });

            return NextResponse.json({ logos, isDefault });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Logo GET error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const isAdmin = await checkAdmin({ allowViewer: true });
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { key, logoUrl } = await req.json();
        if (!key || !logoUrl) return NextResponse.json({ error: 'key and logoUrl are required' }, { status: 400 });
        if (!Object.keys(DEFAULT_LOGOS).includes(key) && key !== 'site_logo') {
            return NextResponse.json({ error: 'Invalid logo key' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            await ensureTable(client);
            await client.query(`
                INSERT INTO site_settings (key, value)
                VALUES ($1, $2)
                ON CONFLICT (key) DO UPDATE SET value = $2, updated_at = CURRENT_TIMESTAMP
            `, [key, JSON.stringify({ url: logoUrl })]);
            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Logo POST error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');
        
        if (!key || (!Object.keys(DEFAULT_LOGOS).includes(key) && key !== 'site_logo')) {
            return NextResponse.json({ error: 'Invalid or missing logo key' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            await ensureTable(client);
            await client.query("DELETE FROM site_settings WHERE key = $1", [key]);
            if (key === 'logo_header') {
                // Also delete old site_logo key for good measure
                await client.query("DELETE FROM site_settings WHERE key = 'site_logo'");
            }
            return NextResponse.json({ success: true, logoUrl: DEFAULT_LOGOS[key] || '' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Logo DELETE error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
