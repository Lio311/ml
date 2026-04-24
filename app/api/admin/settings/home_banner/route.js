import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            const res = await client.query("SELECT value FROM site_settings WHERE key = 'home_banner'");
            
            if (res.rows.length > 0) {
                return NextResponse.json({ banner: res.rows[0].value });
            } else {
                // Default fallback
                return NextResponse.json({ banner: { type: 'video', url: '/hero-video.mp4', objectPosition: 'center' } });
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Fetch Home Banner Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        
        const { banner } = await req.json();

        const client = await pool.connect();
        try {
            // Ensure table exists just in case
            await client.query(`
                CREATE TABLE IF NOT EXISTS site_settings (
                    id SERIAL PRIMARY KEY,
                    key VARCHAR(255) UNIQUE NOT NULL,
                    value JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            await client.query(`
                INSERT INTO site_settings (key, value)
                VALUES ('home_banner', $1)
                ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
            `, [JSON.stringify(banner)]);

            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update Home Banner Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
