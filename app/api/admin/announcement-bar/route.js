import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

const DEFAULT_BAR = {
    enabled: false,
    text: 'משלוחים חינם בכל הזמנה מעל 500 ₪',
    bgColor: '#000000',
    textColor: '#ffffff',
};

// Public GET — no auth
export async function GET() {
    try {
        const res = await pool.query("SELECT value FROM site_settings WHERE key = 'announcement_bar'");
        if (res.rows.length > 0) {
            return NextResponse.json({ bar: res.rows[0].value });
        }
        return NextResponse.json({ bar: DEFAULT_BAR });
    } catch (error) {
        console.error('Fetch Announcement Bar Error:', error);
        return NextResponse.json({ bar: DEFAULT_BAR });
    }
}

export async function POST(req) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { bar } = await req.json();

        await pool.query(`
            INSERT INTO site_settings (key, value)
            VALUES ('announcement_bar', $1)
            ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
        `, [JSON.stringify(bar)]);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Update Announcement Bar Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
