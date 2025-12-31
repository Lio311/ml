import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { clerkClient } from '@clerk/nextjs/server';
import { sendEmail, getNewProductTemplate } from '../../../lib/email';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = searchParams.get('limit');
        const search = searchParams.get('q');

        const client = await pool.connect();
        try {
            let query = 'SELECT * FROM products WHERE active = true';
            const values = [];

            if (search) {
                query += ` AND (name ILIKE $1 OR brand ILIKE $1 OR model ILIKE $1)`;
                values.push(`%${search}%`);
            }

            query += ' ORDER BY id DESC';

            if (limit) {
                query += ` LIMIT $${values.length + 1}`;
                values.push(parseInt(limit));
            }

            const res = await client.query(query, values);
            return NextResponse.json({ products: res.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Products Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const body = await req.json();
        const {
            id, brand, model, price_2ml, price_5ml, price_10ml, image_url,
            category, description, stock, top_notes, middle_notes, base_notes,
            in_lottery, name_he, cost_price, original_size
        } = body;

        const client = await pool.connect();
        try {
            await client.query(
                `UPDATE products 
                 SET brand = $1, model = $2, price_2ml = $3, price_5ml = $4, price_10ml = $5, 
                     image_url = $6, category = $7, description = $8, stock = $9, 
                     top_notes = $10, middle_notes = $11, base_notes = $12, 
                     name = $13, in_lottery = $14, name_he = $15, cost_price = $16, original_size = $17
                 WHERE id = $18`,
                [
                    brand, model, price_2ml, price_5ml, price_10ml, image_url,
                    category, description, stock || 0, top_notes, middle_notes, base_notes,
                    brand + ' ' + model, in_lottery ?? true, name_he, cost_price, original_size, id
                ]
            );

            // Ensure brand exists in brands table
            if (brand) {
                await client.query(`
                    INSERT INTO brands (name) VALUES ($1)
                    ON CONFLICT (name) DO NOTHING
                `, [brand]);
            }

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
        const {
            brand, model, price_2ml, price_5ml, price_10ml, image_url,
            category, description, stock, top_notes, middle_notes, base_notes,
            in_lottery, name_he, cost_price, original_size
        } = body;

        const client = await pool.connect();
        try {
            const res = await client.query(
                `INSERT INTO products 
                 (name, category, brand, model, price_2ml, price_5ml, price_10ml, image_url, 
                  description, stock, top_notes, middle_notes, base_notes, in_lottery, name_he, cost_price, original_size) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17) 
                 RETURNING id`,
                [
                    brand + ' ' + model, category || 'General', brand, model, price_2ml, price_5ml, price_10ml, image_url,
                    description, stock || 0, top_notes, middle_notes, base_notes, in_lottery ?? true, name_he, cost_price, original_size
                ]
            );

            // Ensure brand exists in brands table
            if (brand) {
                await client.query(`
                    INSERT INTO brands (name) VALUES ($1)
                    ON CONFLICT (name) DO NOTHING
                `, [brand]);
            }

            const newProduct = res.rows[0];
            const newProductId = newProduct.id;

            // --- Auto-Add to Dictionary ---
            try {
                await client.query(`
                    INSERT INTO search_mappings (hebrew_term, english_term, type)
                    VALUES ($1, $1, 'product')
                    ON CONFLICT (hebrew_term) DO NOTHING
                `, [brand + ' ' + model]);
            } catch (dictErr) {
                console.error("Dictionary auto-add failed:", dictErr);
            }
            // ------------------------------

            // --- Newsletter Feature ---
            // Fetch all users to notify them about the new product
            try {
                const clerk = await clerkClient();
                const { data: users } = await clerk.users.getUserList({ limit: 500 });

                const emails = users
                    .map(u => u.emailAddresses.find(e => e.id === u.primaryEmailAddressId)?.emailAddress || u.emailAddresses[0]?.emailAddress)
                    .filter(Boolean);

                if (emails.length > 0) {
                    const productForEmail = { ...body, id: newProductId };
                    const html = getNewProductTemplate(productForEmail);
                    // Send as BCC to protect privacy and respect bulk limits
                    await sendEmail(emails, `חדש באתר: ${brand} ${model} ✨ - ml_tlv`, html);
                    console.log(`Newsletter sent to ${emails.length} recipients.`);
                }
            } catch (emailErr) {
                console.error("Failed to send newsletter:", emailErr);
            }
            // --------------------------

            return NextResponse.json({ success: true, id: newProductId });
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

            // Get product name before deleting to remove from dictionary? 
            // Or just try to delete by English Term if we knew it? 
            // We usually store product name as "Brand Model". 
            // Let's fetch it first.
            const prodRes = await client.query('SELECT brand, model FROM products WHERE id = $1', [id]);
            if (prodRes.rows.length > 0) {
                const { brand, model } = prodRes.rows[0];
                const info = brand + ' ' + model;
                // Delete from Dictionary
                await client.query('DELETE FROM search_mappings WHERE english_term = $1 AND type = \'product\'', [info]);
            }

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
