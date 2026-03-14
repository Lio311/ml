import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET(req, { params }) {
    try {
        const { slug } = await params;

        if (!slug) {
            return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // Fetch Catalog
            const catalogRes = await client.query('SELECT id, name, description FROM user_catalogs WHERE slug = $1', [slug]);
            
            if (catalogRes.rows.length === 0) {
                return NextResponse.json({ error: 'Catalog not found' }, { status: 404 });
            }

            const catalog = catalogRes.rows[0];

            // Fetch Items
            const itemsRes = await client.query('SELECT id, name, description, price, image_url FROM user_catalog_items WHERE catalog_id = $1 ORDER BY created_at DESC', [catalog.id]);

            return NextResponse.json({
                catalog: catalog,
                items: itemsRes.rows
            });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching public catalog:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
