import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

const DEFAULT_LOGO = '/logo_v5.png';

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
            const res = await client.query("SELECT value FROM site_settings WHERE key = 'site_logo'");
            const logoUrl = res.rows.length > 0 ? res.rows[0].value?.url : null;
            return NextResponse.json({ logoUrl: logoUrl || DEFAULT_LOGO, isDefault: !logoUrl });
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
        const isAdmin = await checkAdmin();
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { logoUrl } = await req.json();
        if (!logoUrl) return NextResponse.json({ error: 'logoUrl is required' }, { status: 400 });

        const client = await pool.connect();
        try {
            await ensureTable(client);
            await client.query(`
                INSERT INTO site_settings (key, value)
                VALUES ('site_logo', $1)
                ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
            `, [JSON.stringify({ url: logoUrl })]);
            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Logo POST error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const client = await pool.connect();
        try {
            await ensureTable(client);
            await client.query("DELETE FROM site_settings WHERE key = 'site_logo'");
            return NextResponse.json({ success: true, logoUrl: DEFAULT_LOGO });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Logo DELETE error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
