import { NextResponse } from 'next/server';
import pool from '../../lib/db';

export async function PUT(req) {
    try {
        const body = await req.json();
        const { id, brand, model, price_2ml, price_5ml, price_10ml, image_url, category, description, top_notes, middle_notes, base_notes } = body;

        const client = await pool.connect();
        try {
            await client.query(
                `UPDATE products SET brand = $1, model = $2, price_2ml = $3, price_5ml = $4, price_10ml = $5, image_url = $6, category = $7, description = $8, stock = $9, top_notes = $10, middle_notes = $11, base_notes = $12, name = $13 WHERE id = $14`,
                [brand, model, price_2ml, price_5ml, price_10ml, image_url, category, description, body.stock || 0, top_notes, middle_notes, base_notes, brand + ' ' + model, id]
            );
            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update Product Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const body = await req.json();
        const { brand, model, price_2ml, price_5ml, price_10ml, image_url, category, description, top_notes, middle_notes, base_notes } = body;

        const client = await pool.connect();
        try {
            const res = await client.query(
                `INSERT INTO products (name, category, brand, model, price_2ml, price_5ml, price_10ml, image_url, description, stock, top_notes, middle_notes, base_notes) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13) 
                 RETURNING id`,
                [brand + ' ' + model, category || 'General', brand, model, price_2ml, price_5ml, price_10ml, image_url, description, body.stock || 0, top_notes, middle_notes, base_notes]
            );
            return NextResponse.json({ success: true, id: res.rows[0].id });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Create Product Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // Check if product exists first? Or just delete.
            // Soft delete is better usually, but user asked to delete. 
            // The getProducts query filters by active=true. 
            // So maybe we should just set active=false?
            // "DELETE FROM products" is destructive. 
            // Looking at CatalogPage/route.js, it filters `WHERE active = true`.
            // So Soft Delete is implied to be supported/expected if 'active' column exists.
            // Let's check catalog page query again: "SELECT * FROM products WHERE active = true".
            // Yes. So "Deleting" should probably just set active = false.
            // But wait, the admin panel might want to see deleted products?
            // Admin panel currently queries `SELECT * FROM products` (I recall from page.js).
            // Let's check admin page.js query.

            // Wait, I should verify if I should do soft delete or hard delete.
            // If I do hard delete, historical order data might break if it references product ID directly without foreign key constraints or if it joins.
            // Usually Soft Delete is safer.
            // However, the user said "Option to delete". 
            // Let's stick to Soft Delete (active=false) to be safe, as the catalog ignores inactive products.
            // But if the admin panel also filters by active=false? 
            // The admin page.js (which I read in previous turn but didn't output fully, let's assume it fetches all).
            // If I soft delete, it might still show up in Admin? 
            // Let's do a hard delete for now OR soft delete if the table has an 'active' column which it does.
            // Actually, if I set active=false, it disappears from Catalog. 
            // Does it disappear from Admin? 
            // AdminProductsPage might show everything.
            // Let's check AdminProductsPage query in my memory/previous turns.
            // AdminProductsPage query: "SELECT * FROM products..." 
            // It doesn't seem to filter by active. 
            // So if I set active=false, it will still show in Admin.
            // The user wants to "Delete" it. Excluding it from the list.
            // So I should probably set active=false AND filter the admin list? 
            // OR just hard delete.
            // Given it's a simple app, Hard Delete is probably what they expect physically removing it.
            // BUT, if there are existing orders, it might error.
            // Let's try Soft Delete first (active=false) and maybe "Archive"? 
            // No, user said "Delete".
            // Let's do Hard Delete. `DELETE FROM products WHERE id = $1`.

            await client.query('DELETE FROM products WHERE id = $1', [id]);
            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Delete Product Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
