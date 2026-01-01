import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

const DEFAULT_MENU = [
    { id: 'home', label: 'דף הבית', path: '/', visible: true, order: 1 },
    { id: 'brands', label: 'מותגים', path: '/brands', visible: true, order: 2 },
    { id: 'catalog', label: 'קטלוג', path: '/catalog', visible: true, order: 3 },
    { id: 'matching', label: 'התאמת מארזים', path: '/matching', visible: true, order: 4 },
    { id: 'requests', label: 'בקשת בשמים', path: '/requests', visible: true, order: 5 },
    { id: 'lottery', label: 'הגרלה', path: '/lottery', visible: true, order: 6, isRed: true },
    { id: 'contact', label: 'צור קשר', path: '/contact', visible: true, order: 7 }
];

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
            const res = await client.query("SELECT value FROM site_settings WHERE key = 'main_menu'");

            if (res.rows.length === 0) {
                // Seed on the fly if missing
                await client.query(`
                    INSERT INTO site_settings (key, value)
                    VALUES ('main_menu', $1)
                    ON CONFLICT (key) DO NOTHING
                `, [JSON.stringify(DEFAULT_MENU)]);
                return NextResponse.json({ menu: DEFAULT_MENU });
            }
            return NextResponse.json({ menu: res.rows[0].value });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Fetch Settings Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const { menu } = await req.json();
        console.log('Received menu to save:', JSON.stringify(menu));
        const client = await pool.connect();
        try {
            await ensureTable(client);
            await client.query(`
                INSERT INTO site_settings (key, value)
                VALUES ('main_menu', $1)
                ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
            `, [JSON.stringify(menu)]);
            console.log('Menu saved successfully');
            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update Settings Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
