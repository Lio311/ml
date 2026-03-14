import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import pool from '@/app/lib/db';
import { sendEmail, getOrderConfirmationTemplate, getAdminNewOrderTemplate } from '@/app/lib/email';

export async function POST(req, { params }) {
    try {
        const { id: catalogId } = params;
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { items, total, freeSamples, notes, deliveryMethod, phoneNumber } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Fetch catalog info (Support both ID and Slug)
            let catRes;
            if (!isNaN(catalogId)) {
                catRes = await client.query('SELECT id, name, contact_email FROM user_catalogs WHERE id = $1 OR slug = $2', [catalogId, catalogId]);
            } else {
                catRes = await client.query('SELECT id, name, contact_email FROM user_catalogs WHERE slug = $1', [catalogId]);
            }

            if (catRes.rows.length === 0) {
                console.error(`Catalog lookup failed for identifier: ${catalogId}`);
                return NextResponse.json({ error: 'Catalog not found' }, { status: 404 });
            }
            const actualCatalogId = catRes.rows[0].id;
            const catalogOwnerEmail = catRes.rows[0].contact_email;
            const catalogName = catRes.rows[0].name;

            // --- JIT USER SYNC ---
            const clerkEmail = user.emailAddresses[0]?.emailAddress || '';
            const clerkFirstName = user.firstName || '';
            const clerkLastName = user.lastName || '';
            const clerkRole = user.publicMetadata?.role || 'customer';
            const clerkCreatedAt = new Date(user.createdAt);

            await client.query(`
                INSERT INTO users (id, email, first_name, last_name, phone, role, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                ON CONFLICT (email) DO UPDATE SET
                    id = EXCLUDED.id,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    phone = EXCLUDED.phone,
                    role = EXCLUDED.role,
                    updated_at = NOW()
            `, [userId, clerkEmail, clerkFirstName, clerkLastName, phoneNumber || '', clerkRole, clerkCreatedAt]);

            // 1. Create Order
            const customerDetails = {
                clerk_id: userId,
                name: `${user.firstName} ${user.lastName}`,
                email: clerkEmail,
                phone: phoneNumber || '',
            };

            const orderResult = await client.query(
                `INSERT INTO orders (customer_details, total_amount, items, free_samples_count, status, notes, delivery_method, catalog_id)
                 VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7)
                 RETURNING id`,
                [JSON.stringify(customerDetails), total, JSON.stringify(items), freeSamples || 0, notes || '', deliveryMethod || 'mail', actualCatalogId]
            );

            const orderId = orderResult.rows[0].id;

            // 1.1 Notification for catalog owner? 
            // In a real system we'd have a catalog_notifications table or similar. For now, email is enough.

            await client.query('COMMIT');

            // Send Emails
            const adminEmail = process.env.ADMIN_EMAIL || 'lior31197@gmail.com';
            
            // 1. Email to Customer
            const customerHtml = getOrderConfirmationTemplate(orderId, items, total, freeSamples, notes, deliveryMethod || 'mail', 0); // Shipping cost included in total for catalogs
            await sendEmail(clerkEmail, `אישור הזמנה מ-${catalogName} #${orderId}`, customerHtml);

            // 2. Email to Catalog Owner
            const ownerHtml = getAdminNewOrderTemplate(orderId, `${user.firstName} ${user.lastName}`, total, items, deliveryMethod || 'mail', 0, phoneNumber);
            await sendEmail(catalogOwnerEmail, `הזמנה חדשה התקבלה בקטלוג שלך #${orderId} 🔥`, ownerHtml);

            // 3. Email to Site Admin
            await sendEmail(adminEmail, `הזמנת קטלוג משתמש חדשה #${orderId} (${catalogName})`, ownerHtml);

            return NextResponse.json({ success: true, orderId });

        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Catalog Order creation error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
