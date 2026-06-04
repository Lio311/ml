import { NextResponse } from 'next/server';
import pool from '../../lib/db';

export async function POST(req) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email || !email.includes('@')) {
            return NextResponse.json({ error: 'כתובת אימייל לא חוקית' }, { status: 400 });
        }

        const normalizedEmail = email.toLowerCase().trim();

        await pool.query(`
            CREATE TABLE IF NOT EXISTS unsubscribed_emails (
                email VARCHAR(255) PRIMARY KEY,
                unsubscribed_at TIMESTAMP DEFAULT NOW()
            )
        `);

        await pool.query(`
            INSERT INTO unsubscribed_emails (email, unsubscribed_at)
            VALUES ($1, NOW())
            ON CONFLICT (email) DO NOTHING
        `, [normalizedEmail]);

        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error unsubscribing:', err);
        return NextResponse.json({ error: 'שגיאה במערכת' }, { status: 500 });
    }
}
