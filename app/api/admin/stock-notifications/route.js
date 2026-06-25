import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';
import { sendEmail, getBackInStockTemplate } from '@/app/lib/email';
import { recordAuditLog } from '@/app/lib/audit';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const isAdmin = await checkAdmin({ allowViewer: true });
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const client = await pool.connect();
        try {
            // Fetch products that have pending subscriptions
            const res = await client.query(`
                SELECT 
                    p.id, 
                    p.brand, 
                    p.model, 
                    p.brand_he, 
                    p.model_he, 
                    p.image_url, 
                    p.stock,
                    p.active,
                    COUNT(s.id)::int as subscriber_count
                FROM products p
                JOIN back_in_stock_subscriptions s ON p.id = s.product_id
                WHERE s.status = 'pending'
                GROUP BY p.id
                ORDER BY subscriber_count DESC
            `);

            return NextResponse.json(res.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Fetch Stock Notifications Error:', error);
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
        const { productId, newStock } = body;

        if (!productId || newStock === undefined) {
            return NextResponse.json({ error: 'Missing productId or newStock' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // 1. Check if product is active (Requirement 3: send only if active)
            const prodRes = await client.query('SELECT * FROM products WHERE id = $1', [productId]);
            if (prodRes.rows.length === 0) {
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }

            const product = prodRes.rows[0];
            if (!product.active) {
                return NextResponse.json({ error: 'Product must be Active to send notifications.' }, { status: 400 });
            }

            // 2. Fetch pending subscribers
            const subRes = await client.query('SELECT user_email FROM back_in_stock_subscriptions WHERE product_id = $1 AND status = \'pending\'', [productId]);
            const emails = subRes.rows.map(r => r.user_email);

            if (emails.length === 0) {
                // If no subscribers, just update stock? 
                // User said "שם מעדכנים את המלאי החדש... וגם רשימה של המשתמשים".
                // I'll update stock anyway.
                await client.query('UPDATE products SET stock = $1 WHERE id = $2', [newStock, productId]);
                return NextResponse.json({ success: true, message: 'Stock updated. No subscribers to notify.' });
            }

            // 3. Update stock in DB
            await client.query('UPDATE products SET stock = $1 WHERE id = $2', [newStock, productId]);

            // 4. Send Emails
            const html = getBackInStockTemplate(product);
            // Using BCC for multiple recipients
            await sendEmail(emails, `הוא חזר! ${product.brand_he || product.brand} ${product.model_he || product.model} שוב במלאי ✨`, html, 'stock_notification');

            // 5. Update subscription status
            await client.query('UPDATE back_in_stock_subscriptions SET status = \'notified\' WHERE product_id = $1 AND status = \'pending\'', [productId]);

            // 6. Audit Log
            const authData = await clerkAuth();
            await recordAuditLog({
                userId: authData?.userId,
                action: 'send_stock_notification',
                entityType: 'product',
                entityId: String(productId),
                details: { newStock, notifiedCount: emails.length },
                req
            });

            revalidatePath('/catalog');
            revalidatePath(`/product/${product.id}`);

            return NextResponse.json({ success: true, notifiedCount: emails.length });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Send Notifications Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
