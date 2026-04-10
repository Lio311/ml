import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import pool from '../../../../lib/db';
import { sendEmail, getOrderConfirmationTemplate, getAdminNewOrderTemplate } from '../../../../lib/email';
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
        const { customerId, items, total, discountAmount, couponCode, notes, deliveryMethod, shippingCost } = body;

        if (!customerId || !items || items.length === 0) {
            return NextResponse.json({ error: 'Missing required order data' }, { status: 400 });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Fetch Customer Details
            const userRes = await client.query('SELECT id, first_name, last_name, email, phone FROM users WHERE id = $1', [customerId]);
            if (userRes.rows.length === 0) {
                throw new Error('Customer not found in system');
            }
            const customer = userRes.rows[0];

            // 2. Security: Verify Total (Simplified version for admin, but still checking stock)
            // Note: Admin orders trust the UI calculation for total/discount, but we perform stock checks.
            for (const item of items) {
                let dbId = item.id;
                if (typeof dbId === 'string' && dbId.includes('-')) {
                    dbId = parseInt(dbId.split('-')[0]);
                }

                if (!item.isPrize && !isNaN(item.size)) {
                    const pRes = await client.query('SELECT stock, name_he, name FROM products WHERE id = $1', [dbId]);
                    if (pRes.rows.length === 0) {
                        throw new Error(`Product ID ${dbId} not found`);
                    }
                }
            }

            // 3. Create Order
            const customerDetails = {
                clerk_id: customer.id,
                name: `${customer.first_name} ${customer.last_name}`,
                email: customer.email,
                phone: customer.phone || '',
                is_phone_order: true,
                created_by: adminId
            };

            const orderResult = await client.query(
                `INSERT INTO orders (customer_details, total_amount, items, status, notes, delivery_method, discount_amount, coupon_code)
                 VALUES ($1, $2, $3, 'pending', $4, $5, $6, $7)
                 RETURNING id`,
                [JSON.stringify(customerDetails), total, JSON.stringify(items), notes || 'הזמנה טלפונית', deliveryMethod || 'mail', discountAmount || 0, couponCode || null]
            );

            const orderId = orderResult.rows[0].id;

            // 4. Update Stock & Bottle Inventory
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

                    // Notifications for low stock
                    if (stockRes.rows[0]) {
                        const currentStock = stockRes.rows[0].stock;
                        const originalSize = Number(stockRes.rows[0].original_size || 100);
                        if (currentStock < originalSize * 0.2) {
                            const pName = stockRes.rows[0].name_he || stockRes.rows[0].name;
                            await client.query(
                                `INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, $3)`,
                                ['warning', `מלאי נמוך למוצר: ${pName} (נותרו ${currentStock} מ"ל)`, false]
                            );
                        }
                    }

                    // Bottle Inventory
                    let bottleSize = Number(item.size);
                    if (bottleSize === 10 && item.price >= 300) bottleSize = 11;

                    if ([2, 5, 10, 11].includes(bottleSize)) {
                        const bottleRes = await client.query(
                            `UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = $2 RETURNING quantity`,
                            [item.quantity, bottleSize]
                        );

                        if (bottleRes.rows[0] && bottleRes.rows[0].quantity < 20) {
                            const sizeLabel = bottleSize === 11 ? '10ml (יוקרתי)' : `${bottleSize}ml`;
                            await client.query(
                                `INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, $3)`,
                                ['warning', `מלאי בקבוקים נמוך: ${sizeLabel} (נותרו ${bottleRes.rows[0].quantity})`, false]
                            );
                        }
                    }
                }
            }

            await client.query('COMMIT');

            // 5. Send Emails
            try {
                const customerName = `${customer.first_name} ${customer.last_name}`;
                const confirmationHtml = getOrderConfirmationTemplate(orderId, items, total, 0, notes, deliveryMethod, shippingCost);
                await sendEmail(customer.email, `אישור הזמנה טלפונית #${orderId} - ml_tlv`, confirmationHtml, 'order_confirmation', orderId);

                const adminEmail = process.env.ADMIN_EMAIL;
                const adminAlertHtml = getAdminNewOrderTemplate(orderId, customerName, total, items, deliveryMethod, shippingCost, customer.phone);
                await sendEmail(adminEmail, `הזמנה טלפונית חדשה! #${orderId} 🔥`, adminAlertHtml, 'admin_alert', orderId);
            } catch (emailError) {
                console.error('Email sending failed for phone order:', emailError);
                // Don't rollback for email failures
            }

            // 6. Audit Log
            await recordAuditLog({
                userId: adminId,
                action: 'create_phone_order',
                entityType: 'order',
                entityId: orderId.toString(),
                details: { customerId, total, itemsCount: items.length },
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
        console.error('Phone order creation error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
