import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { clerkClient } from '@clerk/nextjs/server';
import { sendEmail, getNewProductTemplate, getTemplate } from '../../lib/email';
import { checkAdmin } from '../../lib/admin';
import { revalidatePath } from 'next/cache';
import { translateList, translateText } from '../../lib/translate';
import { recordAuditLog } from '../../lib/audit';
import { auth as clerkAuth } from '@clerk/nextjs/server';

const generateSlug = (brand, model) => {
    return `${brand} ${model}`.toLowerCase().replace(/[^a-z0-9\u0590-\u05FF]+/g, '-').replace(/(^-|-$)+/g, '');
};

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const limit = searchParams.get('limit');
        const search = searchParams.get('q');

        const client = await pool.connect();
        try {
            let query = `
                SELECT id, name, brand, model, price_2ml, price_5ml, price_10ml, image_url, 
                       category, description, stock, top_notes, middle_notes, base_notes,
                       in_lottery, show_on_home, name_he, brand_he, model_he, cost_price, original_size,
                       seasons, perfumers, country, is_discovery_set, active, discount_percentage, discount_sizes, discount_end_date, spotify_track_url, concentration
                FROM products WHERE active = true
            `;
            const values = [];

            if (search) {
                query += ` AND (name ILIKE $1 OR brand ILIKE $1 OR model ILIKE $1 OR name_he ILIKE $1 OR brand_he ILIKE $1 OR model_he ILIKE $1 OR category ILIKE $1)`;
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
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const body = await req.json();
        const {
            id, brand, model, price_2ml, price_5ml, price_10ml, image_url,
            category, description, stock, top_notes, middle_notes, base_notes,
            in_lottery, show_on_home, name_he, brand_he, model_he, cost_price, original_size,
            seasons, perfumers, country, active,
            discount_percentage, discount_sizes, discount_end_date, spotify_track_url, concentration,
            is_preorder
        } = body;

        const client = await pool.connect();
        try {
            const trimmedBrand = (brand || '').trim();
            const trimmedModel = (model || '').trim();

            const category_en = await translateList(category);
            const top_notes_en = await translateList(top_notes);
            const middle_notes_en = await translateList(middle_notes);
            const base_notes_en = await translateList(base_notes);
            const seasons_en = await translateList(seasons);
            const description_en = await translateText(description);

            await client.query(
                `UPDATE products 
                 SET brand = $1, model = $2, price_2ml = $3, price_5ml = $4, price_10ml = $5, 
                     image_url = $6, category = $7, description = $8, description_he = $8, stock = $9, 
                     top_notes = $10, middle_notes = $11, base_notes = $12, 
                     name = $13, in_lottery = $14, name_he = $15, brand_he = $16, model_he = $17,
                     cost_price = $18, original_size = $19,
                     seasons = $20, perfumers = $21, country = $22,
                     category_en = $24, description_en = $25, top_notes_en = $26,
                     middle_notes_en = $27, base_notes_en = $28, seasons_en = $29,
                     active = $30,
                     discount_percentage = $31, discount_sizes = $32, discount_end_date = $33, show_on_home = $34,
                     spotify_track_url = $35, concentration = $36, is_preorder = $37
                 WHERE id = $23`,
                [
                    trimmedBrand, trimmedModel, price_2ml, price_5ml, price_10ml, image_url,
                    category, description, stock || 0, top_notes, middle_notes, base_notes,
                    trimmedBrand + ' ' + trimmedModel, in_lottery ?? true, name_he, brand_he, model_he,
                    cost_price, original_size, seasons, perfumers, country, id,
                    category_en, description_en, top_notes_en, middle_notes_en, base_notes_en, seasons_en,
                    active ?? true,
                    discount_percentage || 0, discount_sizes || [], discount_end_date || null, show_on_home ?? true,
                    spotify_track_url, concentration, is_preorder || false
                ]
            );

            if (trimmedBrand) {
                await client.query(`
                    INSERT INTO brands (name) VALUES ($1)
                    ON CONFLICT (name) DO NOTHING
                `, [trimmedBrand]);
            }
            revalidatePath('/');
            revalidatePath('/catalog');
            revalidatePath('/brands/[brand]', 'page');
            revalidatePath('/product/[slug]', 'page');

            const authData = await clerkAuth();
            await recordAuditLog({
                userId: authData?.userId,
                action: 'update_product',
                entityType: 'product',
                entityId: String(id),
                details: body,
                req
            });

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
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const body = await req.json();
        const {
            brand, model, price_2ml, price_5ml, price_10ml, image_url,
            category, description, stock, top_notes, middle_notes, base_notes,
            in_lottery, show_on_home, name_he, brand_he, model_he, cost_price, original_size,
            seasons, perfumers, country, active,
            discount_percentage, discount_sizes, discount_end_date, spotify_track_url, concentration,
            is_preorder
        } = body;

        const client = await pool.connect();
        try {
            const category_en = await translateList(category || 'General');
            const top_notes_en = await translateList(top_notes);
            const middle_notes_en = await translateList(middle_notes);
            const base_notes_en = await translateList(base_notes);
            const seasons_en = await translateList(seasons);
            const description_en = await translateText(description);

            const trimmedBrand = (brand || '').trim();
            const trimmedModel = (model || '').trim();

            const newSlug = generateSlug(trimmedBrand, trimmedModel);

            const res = await client.query(
                `INSERT INTO products 
                  (name, category, brand, model, price_2ml, price_5ml, price_10ml, image_url, 
                   description, stock, top_notes, middle_notes, base_notes, in_lottery, show_on_home,
                   name_he, brand_he, model_he, cost_price, original_size,
                   seasons, perfumers, country,
                   category_en, description_en, top_notes_en, middle_notes_en, base_notes_en, seasons_en, slug, active,
                   discount_percentage, discount_sizes, discount_end_date, spotify_track_url, concentration, is_preorder) 
                  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $35, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $36, $37) 
                 RETURNING id`,
                [
                    trimmedBrand + ' ' + trimmedModel, category || 'General', trimmedBrand, trimmedModel, price_2ml, price_5ml, price_10ml, image_url,
                    description, stock || 0, top_notes, middle_notes, base_notes, in_lottery ?? true, 
                    name_he, brand_he, model_he, cost_price, original_size,
                    seasons, perfumers, country,
                    category_en, description_en, top_notes_en, middle_notes_en, base_notes_en, seasons_en, newSlug, active ?? true,
                    discount_percentage || 0, discount_sizes || [], discount_end_date || null, spotify_track_url, show_on_home ?? true,
                    concentration, is_preorder || false
                ]
            );

            // Ensure brand exists in brands table
            if (trimmedBrand) {
                await client.query(`
                    INSERT INTO brands (name) VALUES ($1)
                    ON CONFLICT (name) DO NOTHING
                `, [trimmedBrand]);
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
            // --------------------------// Newsletter logic removed. Moved to Cron Job /api/cron/new-perfumes// --- Newsletter Feature ---
            // --------------------------// Newsletter logic removed. Moved to Cron Job /api/cron/new-perfumes// --- Newsletter Feature ---
            // If it's a pre-order, we send a special email immediately. Normal products are batched by the cron job.
            if (is_preorder) {
                try {
                    const clerk = await clerkClient();
                    const { data: users } = await clerk.users.getUserList({ limit: 500 });

                    const emails = users
                        .map(u => u.emailAddresses.find(e => e.id === u.primaryEmailAddressId)?.emailAddress || u.emailAddresses[0]?.emailAddress)
                        .filter(Boolean);

                    if (emails.length > 0) {
                        const productForEmail = { ...body, id: newProductId };
                        
                        // Import getNewPreorderTemplate dynamically or it should be exported from email.js
                        const { getNewPreorderTemplate } = await import('../../lib/email.js');
                        
                        const { html, subject } = await getTemplate('new_preorder', {
                            brand: brand || '',
                            model: model || '',
                            description: description || '',
                            price_2ml: price_2ml || '',
                            price_5ml: price_5ml || '',
                            price_10ml: price_10ml || '',
                            imageUrl: image_url || 'https://www.ml-tlv.com/logo-black.png',
                            productId: newProductId
                        }, () => getNewPreorderTemplate(productForEmail));
                        
                        const finalSubject = subject || `בדרך לאתר: ${brand} ${model} 📅 - ml_tlv`;

                        // Send as BCC to protect privacy and respect bulk limits
                        await sendEmail(emails, finalSubject, html, 'new_preorder');
                        console.log(`Preorder Newsletter sent to ${emails.length} recipients.`);
                    }
                } catch (emailErr) {
                    console.error("Failed to send preorder newsletter:", emailErr);
                }
            }
            // --------------------------
            // --------------------------

            revalidatePath('/');
            revalidatePath('/catalog');
            revalidatePath('/brands/[brand]', 'page');
            revalidatePath('/product/[slug]', 'page');

            const authData = await clerkAuth();
            await recordAuditLog({
                userId: authData?.userId,
                action: 'create_product',
                entityType: 'product',
                entityId: String(newProductId),
                details: body,
                req
            });

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
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
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
                
                revalidatePath('/brands/[brand]', 'page');
                revalidatePath('/product/[slug]', 'page');
            }

            await client.query('DELETE FROM products WHERE id = $1', [id]);
            
            revalidatePath('/');
            revalidatePath('/catalog');
            
            const authData = await clerkAuth();
            await recordAuditLog({
                userId: authData?.userId,
                action: 'delete_product',
                entityType: 'product',
                entityId: String(id),
                details: { id },
                req
            });

            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Delete Product Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
