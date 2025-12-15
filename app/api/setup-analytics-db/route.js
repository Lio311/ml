import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS site_visits (
                    id SERIAL PRIMARY KEY,
                    page_path TEXT,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log("Analytics DB Setup: Table 'site_visits' verified/created.");
            return NextResponse.json({ success: true, message: 'Analytics DB setup complete: Table verified.' });
        } finally {
            client.release();
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
