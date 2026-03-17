import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

export async function GET(req, { params }) {
    try {
        const { slug } = await params;
        const isAdmin = await checkAdmin();

        if (!slug) {
            return NextResponse.json({ error: 'Slug is required' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // Fetch Catalog (Include config fields for cart sync). Try by slug OR by ID if slug is a number.
            const isNumeric = !isNaN(slug) && !isNaN(parseFloat(slug));
            const catalogRes = await client.query(
                `SELECT id, name, description, image_url, contact_email, slug, self_pickup_active, delivery_active, delivery_price, sample_tiers, is_hidden
                 FROM user_catalogs 
                 WHERE slug = $1 OR (id = $2 AND $3 = true)`, 
                [slug, isNumeric ? parseInt(slug) : -1, isNumeric]
            );
            
            if (catalogRes.rows.length === 0) {
                return NextResponse.json({ error: 'Catalog not found' }, { status: 404 });
            }

            const catalog = catalogRes.rows[0];

            // If hidden and not admin, hide it
            if (catalog.is_hidden && !isAdmin) {
                return NextResponse.json({ error: 'Catalog is currently hidden' }, { status: 403 });
            }

            // Fetch Items
            const itemsRes = await client.query('SELECT id, name, brand, fragrance_name, description, price, prices, image_url, top_notes, middle_notes, base_notes, gender, category, stock_ml FROM user_catalog_items WHERE catalog_id = $1 ORDER BY created_at DESC', [catalog.id]);

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
