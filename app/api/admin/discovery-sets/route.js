import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

// GET all discovery sets
export async function GET() {
    try {
        const isAdmin = await checkAdmin({ allowViewer: true });
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT * FROM products 
                WHERE is_discovery_set = true 
                ORDER BY created_at DESC
            `);
            return NextResponse.json(res.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Fetch discovery sets error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// CREATE new discovery set
export async function POST(req) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const data = await req.json();
        const client = await pool.connect();
        try {
            const trimmedBrand = (data.brand || '').trim();
            const trimmedModel = (data.model || '').trim();
            const generatedSlug = data.slug || `${trimmedBrand || 'brand'}-${trimmedModel || 'model'}-${Date.now()}`.toLowerCase().replace(/[^a-z0-9]+/g, '-');
            const generatedName = data.name || `${trimmedBrand || ''} - ${trimmedModel || ''}`.trim();
            const query = `
                INSERT INTO products (
                    slug, brand, brand_he, model, model_he, name, name_he, name_en,
                    description, description_he, description_en, image_url,
                    category, category_en, stock, active, is_discovery_set, discovery_type,
                    single_price, volume_label, discount_percentage, discount_sizes, discount_end_date,
                    top_notes, top_notes_en, middle_notes, middle_notes_en, base_notes, base_notes_en,
                    seasons, seasons_en, country, country_en, perfumers, perfumers_en,
                    price_2ml, price_5ml, price_10ml, image_url_2, image_url_3, show_on_home
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
                    $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29,
                    $30, $31, $32, $33, $34, $35,
                    $36, $37, $38, $39, $40, $41
                ) RETURNING *
            `;
            const values = [
                generatedSlug, trimmedBrand || null, data.brand_he || null, trimmedModel || null, data.model_he || null,
                generatedName, data.name_he || null, data.name_en || null, data.description || null, data.description_he || null, data.description_en || null,
                data.image_url || null, data.category || null, data.category_en || null, data.stock || 0, data.active ?? true, true, data.discovery_type || 'discovery_set',
                data.single_price || null, data.volume_label || null, data.discount_percentage || null, 
                data.discount_sizes || [], data.discount_end_date || null,
                data.top_notes || null, data.top_notes_en || null, data.middle_notes || null, data.middle_notes_en || null,
                data.base_notes || null, data.base_notes_en || null, data.seasons || null, data.seasons_en || null,
                data.country || null, data.country_en || null, data.perfumers || null, data.perfumers_en || null,
                null, null, null, data.image_url_2 || null, data.image_url_3 || null, data.show_on_home ?? true
            ];
            const res = await client.query(query, values);
            
            if (trimmedBrand) {
                await client.query(`
                    INSERT INTO brands (name) VALUES ($1)
                    ON CONFLICT (name) DO NOTHING
                `, [trimmedBrand]);
            }

            return NextResponse.json(res.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Create discovery set error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

// UPDATE discovery set
export async function PUT(req) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const data = await req.json();
        if (!data.id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            const trimmedBrand = (data.brand || '').trim();
            const trimmedModel = (data.model || '').trim();
            const generatedName = data.name || `${trimmedBrand} - ${trimmedModel}`.trim();
            const query = `
                UPDATE products SET
                    brand = $1, brand_he = $2, model = $3, model_he = $4,
                    name = $5, name_he = $6, name_en = $7, description = $8,
                    description_he = $9, description_en = $10, image_url = $11,
                    category = $12, category_en = $13, stock = $14, active = $15,
                    discovery_type = $16, single_price = $17, volume_label = $18,
                    discount_percentage = $19, discount_sizes = $20, discount_end_date = $21,
                    image_url_2 = $22, image_url_3 = $23, show_on_home = $24
                WHERE id = $25 AND is_discovery_set = true
                RETURNING *
            `;
            const values = [
                trimmedBrand || null, data.brand_he || null, trimmedModel || null, data.model_he || null,
                generatedName || null, data.name_he || null, data.name_en || null, data.description || null,
                data.description_he || null, data.description_en || null, data.image_url || null,
                data.category || null, data.category_en || null, data.stock || 0, data.active ?? true,
                data.discovery_type || 'discovery_set', data.single_price || null, data.volume_label || null,
                data.discount_percentage || null, data.discount_sizes || [], data.discount_end_date || null,
                data.image_url_2 || null, data.image_url_3 || null, data.show_on_home ?? true,
                data.id
            ];
            const res = await client.query(query, values);
            if (res.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
            
            if (trimmedBrand) {
                await client.query(`
                    INSERT INTO brands (name) VALUES ($1)
                    ON CONFLICT (name) DO NOTHING
                `, [trimmedBrand]);
            }

            return NextResponse.json(res.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update discovery set error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
