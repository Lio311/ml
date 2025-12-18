import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            const res = await client.query("SELECT value FROM site_settings WHERE key = 'main_menu'");
            if (res.rows.length === 0) {
                return NextResponse.json({ menu: [] });
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
        const { menu } = await req.json();
        const client = await pool.connect();
        try {
            await client.query(`
                INSERT INTO site_settings (key, value)
                VALUES ('main_menu', $1)
                ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
            `, [JSON.stringify(menu)]);
            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update Settings Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
