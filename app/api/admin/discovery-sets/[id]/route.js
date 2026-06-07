import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

export async function PUT(req, { params }) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const id = params.id;
        const data = await req.json();
        const client = await pool.connect();
        
        try {
            const query = `
                UPDATE products SET
                    slug = COALESCE($1, slug),
                    brand = COALESCE($2, brand),
                    brand_he = COALESCE($3, brand_he),
                    model = COALESCE($4, model),
                    model_he = COALESCE($5, model_he),
                    name = COALESCE($6, name),
                    name_he = COALESCE($7, name_he),
                    name_en = COALESCE($8, name_en),
                    description = COALESCE($9, description),
                    description_he = COALESCE($10, description_he),
                    description_en = COALESCE($11, description_en),
                    image_url = COALESCE($12, image_url),
                    category = COALESCE($13, category),
                    category_en = COALESCE($14, category_en),
                    stock = COALESCE($15, stock),
                    active = COALESCE($16, active),
                    single_price = COALESCE($17, single_price),
                    volume_label = COALESCE($18, volume_label),
                    discount_percentage = $19,
                    discount_sizes = $20,
                    discount_end_date = $21,
                    top_notes = COALESCE($22, top_notes),
                    top_notes_en = COALESCE($23, top_notes_en),
                    middle_notes = COALESCE($24, middle_notes),
                    middle_notes_en = COALESCE($25, middle_notes_en),
                    base_notes = COALESCE($26, base_notes),
                    base_notes_en = COALESCE($27, base_notes_en),
                    seasons = COALESCE($28, seasons),
                    seasons_en = COALESCE($29, seasons_en),
                    country = COALESCE($30, country),
                    country_en = COALESCE($31, country_en),
                    perfumers = COALESCE($32, perfumers),
                    perfumers_en = COALESCE($33, perfumers_en)
                WHERE id = $34 AND is_discovery_set = true
                RETURNING *
            `;
            const values = [
                data.slug, data.brand, data.brand_he, data.model, data.model_he,
                data.name, data.name_he, data.name_en, data.description, data.description_he, data.description_en,
                data.image_url, data.category, data.category_en, data.stock, data.active,
                data.single_price, data.volume_label, data.discount_percentage, data.discount_sizes, data.discount_end_date,
                data.top_notes, data.top_notes_en, data.middle_notes, data.middle_notes_en,
                data.base_notes, data.base_notes_en, data.seasons, data.seasons_en,
                data.country, data.country_en, data.perfumers, data.perfumers_en,
                id
            ];
            
            const res = await client.query(query, values);
            if (res.rowCount === 0) {
                return NextResponse.json({ error: 'Not found' }, { status: 404 });
            }
            return NextResponse.json(res.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update discovery set error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const id = params.id;
        const client = await pool.connect();
        try {
            await client.query('DELETE FROM products WHERE id = $1 AND is_discovery_set = true', [id]);
            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Delete discovery set error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
