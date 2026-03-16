import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            // Fetch basic info for all catalogs to display in the inbox
            const res = await client.query('SELECT id, name, image_url as logo_url FROM user_catalogs');
            return NextResponse.json(res.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching catalogs info:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
