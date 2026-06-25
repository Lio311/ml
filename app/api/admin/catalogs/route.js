import { NextResponse } from 'next/server';
import { checkAdmin } from '@/app/lib/admin';
import pool from '@/app/lib/db';

export async function GET(req) {
    let client;
    try {
        const isAdmin = await checkAdmin({ allowViewer: true });
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        client = await pool.connect();
        const res = await client.query(`
            SELECT 
                c.id, c.name, c.slug, c.contact_email, c.created_at, c.is_hidden,
                COUNT(i.id) as total_items
            FROM user_catalogs c
            LEFT JOIN user_catalog_items i ON c.id = i.catalog_id
            GROUP BY c.id
            ORDER BY c.created_at DESC
        `);
        
        return NextResponse.json(res.rows);
    } catch (error) {
        console.error('Error fetching admin catalogs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}
