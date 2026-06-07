import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

// GET all discovery sets
export async function GET() {
    try {
        const isAdmin = await checkAdmin();
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
            const query = `
                INSERT INTO products (
                    slug, brand, brand_he, model, model_he, name, name_he, name_en,
                    description, description_he, description_en, image_url,
                    category, category_en, stock, active, is_discovery_set, discovery_type,
                    single_price, volume_label, discount_percentage, discount_sizes, discount_end_date,
                    top_notes, top_notes_en, middle_notes, middle_notes_en, base_notes, base_notes_en,
                    seasons, seasons_en, country, country_en, perfumers, perfumers_en,
                    price_2ml, price_5ml, price_10ml
                ) VALUES (
                    $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18,
                    $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29,
                    $30, $31, $32, $33, $34, $35,
                    $36, $37, $38
                ) RETURNING *
            `;
            const values = [
                data.slug || null, data.brand, data.brand_he, data.model, data.model_he,
                data.name, data.name_he, data.name_en, data.description, data.description_he, data.description_en,
                data.image_url, data.category, data.category_en, data.stock || 0, data.active ?? true, true, data.discovery_type || 'discovery_set',
                data.single_price || null, data.volume_label || null, data.discount_percentage || null, 
                data.discount_sizes || null, data.discount_end_date || null,
                data.top_notes, data.top_notes_en, data.middle_notes, data.middle_notes_en,
                data.base_notes, data.base_notes_en, data.seasons, data.seasons_en,
                data.country, data.country_en, data.perfumers, data.perfumers_en,
                null, null, null
            ];
            const res = await client.query(query, values);
            return NextResponse.json(res.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Create discovery set error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
