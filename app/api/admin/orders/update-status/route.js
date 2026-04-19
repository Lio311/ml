import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import pool from '@/app/lib/db';
import { revalidatePath } from 'next/cache';
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

            // Bottle inventory logic
            if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
                for (const item of (order.items || [])) {
                    const itemSize = parseFloat(String(item.size));
                    if (!item.isPrize && !isNaN(itemSize)) {
                        // Restore Bottle Inventory
                        let bSize = itemSize;
                        if (bSize === 10 && item.price >= 300) bSize = 11;
                        if ([2, 5, 10, 11].includes(bSize)) {
                            await client.query('UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = $2', [item.quantity, bSize]);
                        }

                        // Restore Product ML Stock
                        const amountToRestore = itemSize * item.quantity;
                        let dbId = item.id;
                        if (typeof dbId === 'string' && dbId.includes('-')) {
                            dbId = parseInt(dbId.split('-')[0]);
                        }
                        await client.query('UPDATE products SET stock = stock + $1 WHERE id = $2', [amountToRestore, dbId]);
                    }
                }
                if (order.free_samples_count > 0) {
                    await client.query('UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = 2', [order.free_samples_count]);
                }
            }
            if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
                for (const item of (order.items || [])) {
                    const itemSize = parseFloat(String(item.size));
                    if (!item.isPrize && !isNaN(itemSize)) {
                        // Deduct Bottle Inventory
                        let bSize = itemSize;
                        if (bSize === 10 && item.price >= 300) bSize = 11;
                        if ([2, 5, 10, 11].includes(bSize)) {
                            await client.query('UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = $2', [item.quantity, bSize]);
                        }

                        // Deduct Product ML Stock
                        const amountToDeduct = itemSize * item.quantity;
                        let dbId = item.id;
                        if (typeof dbId === 'string' && dbId.includes('-')) {
                            dbId = parseInt(dbId.split('-')[0]);
                        }
                        await client.query('UPDATE products SET stock = GREATEST(0, stock - $1) WHERE id = $2', [amountToDeduct, dbId]);
                    }
                }
                if (order.free_samples_count > 0) {
                    await client.query('UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = 2', [order.free_samples_count]);
                }
            }

            // Email
            if (order.customer_details?.email) {
                try {
                    const statusMap = {
                        'pending': { label: 'ממתין', body: 'ההזמנה שלך התקבלה וממתינה לאישור.' },
                        'processing': { label: 'בטיפול', body: 'ההזמנה שלך התקבלה ונמצאת בטיפול הצוות.' },
                        'shipped': { label: 'נשלחה', body: 'חדשות טובות! ההזמנה שלך נארזה ונמסרה לשליח / יצאה למשלוח.' },
                        'ready_for_pickup': { label: 'מוכנה לאיסוף', body: 'ההזמנה שלך מוכנה לאיסוף! מוזמנים להגיע ולאסוף אותה.' },
                        'completed': { label: 'הושלמה / נמסרה', body: 'ההזמנה נמסרה בהצלחה. תודה שבחרת בנו!' },
                        'cancelled': { label: 'בוטלה', body: 'ההזמנה בוטלה. אם זו טעות, נא ליצור איתנו קשר.' }
                    };
                    
                    const mapped = statusMap[status] || { label: status, body: `הסטטוס של ההזמנה שלך עודכן ל-${status}.` };
                    const cleanName = (order.customer_details.name || '').replace(/\bnull\b/gi, '').trim();

                    const { html: dynamicHtml, subject: dynamicSubject } = await getTemplate('status_update', { 
                        orderId, 
                        status: mapped.label, 
                        messageBody: mapped.body,
                        name: cleanName 
                    }, getStatusUpdateTemplate.bind(null, orderId, status, cleanName));
                    
                    await sendEmail(order.customer_details.email, dynamicSubject || `עדכון סטטוס הזמנה #${orderId} - ml_tlv`, dynamicHtml, 'status_update', orderId);
                } catch (e) { console.error('Email error:', e); }
            }
        }

        if (deliveryMethod && deliveryMethod !== 'no_change') {
            await client.query('UPDATE orders SET delivery_method = $1 WHERE id = $2', [deliveryMethod, orderId]);
        }

        revalidatePath('/admin/orders');

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
