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
                    perfumers_en = COALESCE($33, perfumers_en),
                    discovery_type = COALESCE($34, discovery_type),
                    image_url_2 = COALESCE($35, image_url_2),
                    image_url_3 = COALESCE($36, image_url_3)
                WHERE id = $37 AND is_discovery_set = true
                RETURNING *
            `;
            const values = [
                data.slug ?? null, data.brand ?? null, data.brand_he ?? null, data.model ?? null, data.model_he ?? null,
                data.name ?? null, data.name_he ?? null, data.name_en ?? null, data.description ?? null, data.description_he ?? null, data.description_en ?? null,
                data.image_url ?? null, data.category ?? null, data.category_en ?? null, data.stock ?? null, data.active ?? null,
                data.single_price ?? null, data.volume_label ?? null, data.discount_percentage ?? null, data.discount_sizes ?? null, data.discount_end_date ?? null,
                data.top_notes ?? null, data.top_notes_en ?? null, data.middle_notes ?? null, data.middle_notes_en ?? null,
                data.base_notes ?? null, data.base_notes_en ?? null, data.seasons ?? null, data.seasons_en ?? null,
                data.country ?? null, data.country_en ?? null, data.perfumers ?? null, data.perfumers_en ?? null,
                data.discovery_type ?? null,
                data.image_url_2 ?? null, data.image_url_3 ?? null,
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
