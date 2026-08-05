import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import pool from '@/app/lib/db';
import { revalidatePath, revalidateTag } from 'next/cache';
import { sendEmail, getTemplate, getStatusUpdateTemplate } from '@/app/lib/email';
import { recordAuditLog } from '@/app/lib/audit';
import { auth as clerkAuth } from '@clerk/nextjs/server';

export async function POST(req) {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    const email = user?.emailAddresses[0]?.emailAddress;
    if (email !== process.env.ADMIN_EMAIL && role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let orderId, status, deliveryMethod;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const body = await req.json();
        orderId = body.orderId;
        status = body.status;
        deliveryMethod = body.deliveryMethod;
    } else {
        const formData = await req.formData();
        orderId = formData.get('orderId');
        status = formData.get('status');
        deliveryMethod = formData.get('deliveryMethod');
    }

    if (!orderId || (!status && !deliveryMethod)) {
        return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        const res = await client.query('SELECT id, status, items, free_samples_count, customer_details, delivery_method, total_amount FROM orders WHERE id = $1', [orderId]);
        const order = res.rows[0];
        if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const oldStatus = order.status;
        
        if (status && status !== 'no_change') {
            const newStatus = status;

            await client.query('UPDATE orders SET status = $1 WHERE id = $2', [newStatus, orderId]);

            // Conversion tracking for preorders
            if (newStatus === 'in_progress' && oldStatus !== 'in_progress') {
                try {
                    const customerEmail = typeof order.customer_details === 'string' 
                        ? JSON.parse(order.customer_details)?.email 
                        : order.customer_details?.email;
                        
                    if (customerEmail) {
                        const productIds = (order.items || []).flatMap(i => {
                            if (i.type === 'bundle' && Array.isArray(i.items)) {
                                return i.items.map(inner => parseInt(inner.id)).filter(id => !isNaN(id));
                            }
                            let dbId = i.id;
                            if (typeof dbId === 'string' && dbId.includes('-')) {
                                dbId = parseInt(dbId.split('-')[0]);
                            }
                            return parseInt(dbId);
                        }).filter(id => !isNaN(id));

                        if (productIds.length > 0) {
                            await client.query(`
                                UPDATE preorders 
                                SET status = 'converted', converted_at = NOW() 
                                WHERE user_email = $1 AND product_id = ANY($2) AND status = 'notified'
                            `, [customerEmail, productIds]);
                        }
                    }
                } catch (e) {
                    console.error('Error updating preorder conversions:', e);
                }
            }

            // Bottle inventory logic
            if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
                for (const item of (order.items || [])) {
                    let dbId = item.id;
                    if (typeof dbId === 'string' && dbId.includes('-')) {
                        dbId = parseInt(dbId.split('-')[0]);
                    } else if (typeof dbId !== 'number') {
                        dbId = parseInt(dbId);
                    }

                    if (item.type === 'bundle' && Array.isArray(item.items)) {
                        const bundleSize = Number(item.size) || 2;
                        for (const innerItem of item.items) {
                            let innerDbId = innerItem.id;
                            if (typeof innerDbId === 'string' && innerDbId.includes('-')) {
                                innerDbId = parseInt(innerDbId.split('-')[0]);
                            }
                            if (!isNaN(innerDbId)) {
                                const revertAmount = bundleSize * (item.quantity || 1);
                                await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [revertAmount, innerDbId]);
                            }
                        }
                        if ([2, 5, 10, 11].includes(bundleSize)) {
                            const totalBottles = item.items.length * (item.quantity || 1);
                            await client.query('UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = $2', [totalBottles, bundleSize]);
                        }
                    } else if (!item.isPrize) {
                        let amountToRestore = 0;
                        if (item.is_discovery_set) {
                            amountToRestore = parseInt(item.quantity) || 0;
                        } else if (!isNaN(parseFloat(String(item.size)))) {
                            amountToRestore = parseFloat(String(item.size)) * (parseInt(item.quantity) || 0);
                        }

                        if (amountToRestore > 0 && !isNaN(dbId)) {
                            await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [amountToRestore, dbId]);

                            if (!item.is_discovery_set) {
                                let bSize = parseFloat(String(item.size));
                                if (bSize === 10 && item.price >= 300) bSize = 11;
                                if ([2, 5, 10, 11].includes(bSize)) {
                                    await client.query('UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = $2', [parseInt(item.quantity) || 0, bSize]);
                                }
                            }
                        }
                    }
                }
                if (order.free_samples_count > 0) {
                    await client.query('UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = 2', [order.free_samples_count]);
                }
            }
            if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
                for (const item of (order.items || [])) {
                    let dbId = item.id;
                    if (typeof dbId === 'string' && dbId.includes('-')) {
                        dbId = parseInt(dbId.split('-')[0]);
                    } else if (typeof dbId !== 'number') {
                        dbId = parseInt(dbId);
                    }

                    if (item.type === 'bundle' && Array.isArray(item.items)) {
                        const bundleSize = Number(item.size) || 2;
                        for (const innerItem of item.items) {
                            let innerDbId = innerItem.id;
                            if (typeof innerDbId === 'string' && innerDbId.includes('-')) {
                                innerDbId = parseInt(innerDbId.split('-')[0]);
                            }
                            if (!isNaN(innerDbId)) {
                                const amountToDeduct = bundleSize * (item.quantity || 1);
                                await client.query('UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2', [amountToDeduct, innerDbId]);
                            }
                        }
                        if ([2, 5, 10, 11].includes(bundleSize)) {
                            const totalBottles = item.items.length * (item.quantity || 1);
                            await client.query('UPDATE bottle_inventory SET quantity = GREATEST(0, quantity - $1) WHERE size = $2', [totalBottles, bundleSize]);
                        }
                    } else if (!item.isPrize) {
                        let amountToDeduct = 0;
                        if (item.is_discovery_set) {
                            amountToDeduct = parseInt(item.quantity) || 0;
                        } else if (!isNaN(parseFloat(String(item.size)))) {
                            amountToDeduct = parseFloat(String(item.size)) * (parseInt(item.quantity) || 0);
                        }

                        if (amountToDeduct > 0 && !isNaN(dbId)) {
                            await client.query('UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2', [amountToDeduct, dbId]);

                            if (!item.is_discovery_set) {
                                let bSize = parseFloat(String(item.size));
                                if (bSize === 10 && item.price >= 300) bSize = 11;
                                if ([2, 5, 10, 11].includes(bSize)) {
                                    await client.query('UPDATE bottle_inventory SET quantity = GREATEST(0, quantity - $1) WHERE size = $2', [parseInt(item.quantity) || 0, bSize]);
                                }
                            }
                        }
                    }
                }
                if (order.free_samples_count > 0) {
                    await client.query('UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = 2', [order.free_samples_count]);
                }
            }

        // Delay Email by 2 minutes
        if (order.customer_details?.email) {
            try {
                // Check if there is already a pending email for this order
                const pendingRes = await client.query('SELECT 1 FROM pending_order_emails WHERE order_id = $1', [orderId]);
                if (pendingRes.rows.length === 0) {
                    // Insert a pending record so the cron job picks it up in 2 minutes
                    await client.query(`
                        INSERT INTO pending_order_emails (order_id, initial_status, process_at)
                        VALUES ($1, $2, NOW() + INTERVAL '2 minutes')
                    `, [orderId, oldStatus]);
                }
            } catch (e) { console.error('Error handling delayed email:', e); }
        }
        }

        if (deliveryMethod && deliveryMethod !== 'no_change') {
            await client.query('UPDATE orders SET delivery_method = $1 WHERE id = $2', [deliveryMethod, orderId]);
        }

        revalidatePath('/admin/orders');
        revalidateTag('home-data');
        revalidatePath('/');

        const authData = await clerkAuth();
        await recordAuditLog({
            userId: authData?.userId,
            action: 'update_order_batch',
            entityType: 'order',
            entityId: String(orderId),
            details: { previousStatus: oldStatus, newStatus: status, deliveryMethod },
            req
        });

        return NextResponse.json({ success: true });
    } finally {
        client.release();
    }
}
