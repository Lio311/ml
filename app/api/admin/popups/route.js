import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

// Default Instagram popup — seeded on first load if DB is empty
const DEFAULT_POPUPS = [
    {
        id: 'instagram_popup',
        name: 'פופאפ אינסטגרם',
        enabled: true,
        template: 'instagram',
        delay: 3000,
        frequency: 'daily',
        colors: {
            primary: '#dc2743',
            gradient: ['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888'],
            text: '#ffffff'
        },
        content: {
            title: 'בואו נדבר באינסטגרם!',
            description: 'זקוקים לייעוץ או מענה מהיר? אנחנו זמינים עבורכם ב-ml_tlv לכל שאלה, בכל ימות השבוע.',
            buttonText: 'למעבר לייעוץ אישי',
            buttonUrl: 'https://instagram.com/ml_tlv',
            icon: 'instagram',
            imageUrl: ''
        },
        createdAt: new Date().toISOString()
    }
];

export async function GET() {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const client = await pool.connect();
        try {
            // Ensure table exists
            await client.query(`
                CREATE TABLE IF NOT EXISTS site_settings (
                    id SERIAL PRIMARY KEY,
                    key VARCHAR(255) UNIQUE NOT NULL,
                    value JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            const res = await client.query("SELECT value FROM site_settings WHERE key = 'site_popups'");

            if (res.rows.length > 0) {
                return NextResponse.json({ popups: res.rows[0].value });
            } else {
                // Seed with default Instagram popup
                await client.query(`
                    INSERT INTO site_settings (key, value)
                    VALUES ('site_popups', $1)
                    ON CONFLICT (key) DO NOTHING
                `, [JSON.stringify(DEFAULT_POPUPS)]);

                return NextResponse.json({ popups: DEFAULT_POPUPS });
            }
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Fetch Popups Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { popups } = await req.json();

        if (!Array.isArray(popups)) {
            return NextResponse.json({ error: 'Invalid data: popups must be an array' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
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
                VALUES ('site_popups', $1)
                ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
            `, [JSON.stringify(popups)]);

            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update Popups Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
