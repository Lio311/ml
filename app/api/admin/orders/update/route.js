import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import pool from '../../../../lib/db';
import { sendEmail, getOrderUpdatedTemplate } from '../../../../lib/email';
import { recordAuditLog } from '../../../../lib/audit';
import { checkAdmin } from '../../../../lib/admin';

export async function POST(req) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 });
        }

        const adminUser = await currentUser();
        const adminId = adminUser?.id;

        const body = await req.json();
        const { orderId, items, total, notes, deliveryMethod, shippingCost } = body;

        if (!orderId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required update data' }, { status: 400 });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Fetch Original Order
            const originalOrderRes = await client.query('SELECT items, customer_details, delivery_method, total_amount FROM orders WHERE id = $1', [orderId]);
            if (originalOrderRes.rows.length === 0) {
                throw new Error('Order not found');
            }
            const originalOrder = originalOrderRes.rows[0];
            const originalItems = originalOrder.items || [];
            const customerDetails = originalOrder.customer_details || {};

            // 2. Revert Original Stock & Bottle Inventory
            for (const item of originalItems) {
                let dbId = item.id;
                if (typeof dbId === 'string' && dbId.includes('-')) {
                    dbId = parseInt(dbId.split('-')[0]);
                }

                if (!item.isPrize && !isNaN(item.size)) {
                    const revertAmount = Number(item.size) * item.quantity;
                    await client.query(
                        'UPDATE products SET stock = stock + $1 WHERE id = $2',
                        [revertAmount, dbId]
                    );

                    const bottleSize = Number(item.size);
                    if ([2, 5, 10].includes(bottleSize)) {
                        await client.query(
                            'UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = $2',
                            [item.quantity, bottleSize]
                        );
                    }
                }
            }

            // 3. Apply New Stock & Bottle Inventory
            for (const item of items) {
                let dbId = item.id;
                if (typeof dbId === 'string' && dbId.includes('-')) {
                    dbId = parseInt(dbId.split('-')[0]);
                }

                if (!item.isPrize && !isNaN(item.size)) {
                    const deduction = Number(item.size) * item.quantity;
                    const stockRes = await client.query(
                        `UPDATE products SET stock = stock - $1 WHERE id = $2 RETURNING stock, name_he, name, original_size`,
                        [deduction, dbId]
                    );

                    if (stockRes.rows.length === 0) {
                        throw new Error(`Product ID ${dbId} not found`);
                    }

                    const currentStock = stockRes.rows[0].stock;
                    if (currentStock < 0) {
                        const pName = stockRes.rows[0].name_he || stockRes.rows[0].name;
                        throw new Error(`אין מספיק מלאי למוצר: ${pName}`);
                    }

                    // Notifications for low stock
                    const originalSize = Number(stockRes.rows[0].original_size || 100);
                    if (currentStock < originalSize * 0.2) {
                        const pName = stockRes.rows[0].name_he || stockRes.rows[0].name;
                        await client.query(
                            `INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, $3)`,
                            ['warning', `מלאי נמוך למוצר (עקב עריכה): ${pName} (נותרו \u200E${currentStock} מ"ל)`, false]
                        );
                    }

                    // Bottle Inventory
                    const bottleSize = Number(item.size);
                    if ([2, 5, 10].includes(bottleSize)) {
                        const bottleRes = await client.query(
                            `UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = $2 RETURNING quantity`,
                            [item.quantity, bottleSize]
                        );

                        if (bottleRes.rows[0] && bottleRes.rows[0].quantity < 0) {
                            throw new Error(`אין מספיק בקבוקים בגודל ${bottleSize}ml`);
                        }
                    }
                }
            }

            // 4. Update Order Record
            const updatedCustomerDetails = {
                ...customerDetails,
                shipping_cost: shippingCost,
                total: total, // Internal tracking
                modified_at: new Date().toISOString(),
                modified_by: adminId
            };

            await client.query(
                `UPDATE orders 
                 SET items = $1, 
                     total_amount = $2, 
                     notes = $3, 
                     delivery_method = $4, 
                     customer_details = $5
                 WHERE id = $6`,
                [JSON.stringify(items), total, notes, deliveryMethod, JSON.stringify(updatedCustomerDetails), orderId]
            );

            await client.query('COMMIT');

            // 5. Send Emails
            try {
                const customerName = customerDetails.name || 'לקוח יקר/ה';
                const customerEmail = customerDetails.email;

                // Compute changes summary
                let changesSummary = [];
                if (Number(originalOrder.total_amount) !== Number(total)) {
                    changesSummary.push(`סכום ההזמנה הכולל עודכן מ-${originalOrder.total_amount} ₪ ל-${total} ₪`);
                }
                if (originalOrder.delivery_method !== deliveryMethod) {
                    const oldMethod = originalOrder.delivery_method === 'mail' ? 'משלוח' : 'איסוף עצמי';
                    const newMethod = deliveryMethod === 'mail' ? 'משלוח' : 'איסוף עצמי';
                    changesSummary.push(`שיטת המסירה שונתה מ-${oldMethod} ל-${newMethod}`);
                }
                
                // Compare items (simple array comparison based on stringified value)
                const originalItemsStr = JSON.stringify((originalOrder.items || []).map(i => ({id: i.id, q: i.quantity, s: i.size})));
                const newItemsStr = JSON.stringify((items || []).map(i => ({id: i.id, q: i.quantity, s: i.size})));
                if (originalItemsStr !== newItemsStr) {
                    changesSummary.push('עודכנו פריטים או כמויות של מוצרים בהזמנה');
                }

                if (customerEmail) {
                    const updateHtml = getOrderUpdatedTemplate(orderId, customerName, items, total, deliveryMethod, shippingCost, notes, changesSummary);
                    await sendEmail(customerEmail, `הזמנתך #${orderId} עודכנה - ml_tlv`, updateHtml, 'order_updated', orderId);
                }

                // Admin notification
                const adminEmail = process.env.ADMIN_EMAIL;
                if (adminEmail) {
                    const { getAdminOrderUpdatedTemplate } = await import('../../../../lib/email');
                    const adminUpdateHtml = getAdminOrderUpdatedTemplate(orderId, customerName, total, deliveryMethod, changesSummary);
                    await sendEmail(adminEmail, `הזמנה #${orderId} עודכנה בהצלחה 🔥`, adminUpdateHtml, 'admin_alert', orderId);
                }
            } catch (emailError) {
                console.error('Email sending failed for order update:', emailError);
            }

            // 6. Audit Log
            await recordAuditLog({
                userId: adminId,
                action: 'update_order',
                entityType: 'order',
                entityId: orderId.toString(),
                details: { oldTotal: originalOrder.total_amount, newTotal: total, itemsCount: items.length },
                req
            });

            return NextResponse.json({ success: true, orderId });

        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Order update error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
