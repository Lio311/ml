import { NextResponse } from 'next/server';
import { checkAdmin } from '@/app/lib/admin';
import pool from '@/app/lib/db';

export async function POST(req, { params }) {
    let client;
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        const { is_hidden } = await req.json();

        client = await pool.connect();
        await client.query(
            "UPDATE user_catalogs SET is_hidden = $1 WHERE id = $2",
            [is_hidden, id]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error toggling catalog visibility:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}
