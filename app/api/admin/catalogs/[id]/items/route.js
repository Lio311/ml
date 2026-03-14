import { NextResponse } from 'next/server';
import { checkAdmin } from '@/app/lib/admin';
import pool from '@/app/lib/db';

export async function GET(req, { params }) {
    let client;
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        client = await pool.connect();
        const res = await client.query('SELECT * FROM user_catalog_items WHERE catalog_id = $1 ORDER BY created_at DESC', [id]);
        return NextResponse.json(res.rows);
    } catch (error) {
        console.error('Error fetching admin catalog items:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}
