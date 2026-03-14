import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '@/app/lib/db';

export async function GET(req, { params }) {
    try {
        const { userId, sessionClaims } = await auth();
        const { id } = await params;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Admin check
        const role = sessionClaims?.metadata?.role;
        const userEmail = sessionClaims?.email || '';
        if (role !== 'admin' && userEmail !== 'lior31197@gmail.com') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const client = await pool.connect();
        try {
            const res = await client.query('SELECT * FROM user_catalog_items WHERE catalog_id = $1 ORDER BY created_at DESC', [id]);
            return NextResponse.json(res.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching admin catalog items:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
