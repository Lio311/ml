import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import pool from '../../../../lib/db';
import { sendEmail, getOrderConfirmationTemplate, getAdminNewOrderTemplate, formatItemsHtmlCustomer, formatItemsHtmlAdmin, formatNotesHtml } from '../../../../lib/email';
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
        const { customerId, items, total, discountAmount, couponCode, notes, deliveryMethod, shippingCost, address, phoneNumber } = body;

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

                if (item.type === 'bundle' && Array.isArray(item.items)) {
                    for (const innerItem of item.items) {
                        let innerDbId = innerItem.id;
                        if (typeof innerDbId === 'string' && innerDbId.includes('-')) {
                            innerDbId = parseInt(innerDbId.split('-')[0]);
                        }
                        if (!isNaN(innerDbId)) {
                            const pRes = await client.query('SELECT stock, name_he, name FROM products WHERE id = $1', [innerDbId]);
                            if (pRes.rows.length === 0) {
                                throw new Error(`Product ID ${innerDbId} not found in bundle`);
                            }
                        }
                    }
                    continue;
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
                phone: phoneNumber || customer.phone || '',
                is_phone_order: true,
                created_by: adminId,
                coupon_code: couponCode || null,
                discount_amount: discountAmount || 0,
                address: address || null
            };

            // Update user's saved address and phone if provided in phone order
            if (address || phoneNumber) {
                await client.query(
                    `UPDATE users 
                     SET phone = COALESCE($1, phone),
                         address = COALESCE($2, address)
                     WHERE id = $3`,
                    [phoneNumber || null, address ? JSON.stringify(address) : null, customerId]
                );
            }

            // Note: The 'orders' table does not have 'discount_amount' or 'coupon_code' columns.
            // We store these details within customer_details JSONB to maintain tracking.
            const orderResult = await client.query(
                `INSERT INTO orders (customer_details, total_amount, items, status, notes, delivery_method)
                 VALUES ($1, $2, $3, 'pending', $4, $5)
                 RETURNING id`,
                [JSON.stringify(customerDetails), total, JSON.stringify(items), notes || 'הזמנה טלפונית', deliveryMethod || 'mail']
            );

            const orderId = orderResult.rows[0].id;

            // 3.1 Notify Admin of Phone Order
            const customerFullName = `${customer.first_name || ''} ${customer.last_name || ''}`.trim();
            await client.query(
                `INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, $3)`,
                ['info', `הזמנה טלפונית חדשה! #${orderId} - ${customerFullName}`, false]
            );

            // 4. Update Stock & Bottle Inventory
            const notifiedProducts = new Set();
            for (const item of items) {
                let dbId = item.id;
                if (typeof dbId === 'string' && dbId.includes('-')) {
                    dbId = parseInt(dbId.split('-')[0]);
                }

                if (item.type === 'bundle' && Array.isArray(item.items)) {
                    const bundleSize = Number(item.size) || 2;
                    for (const innerItem of item.items) {
                        let innerDbId = innerItem.id;
                        if (typeof innerDbId === 'string' && innerDbId.includes('-')) {
                            innerDbId = parseInt(innerDbId.split('-')[0]);
                        }
                        if (!isNaN(innerDbId)) {
                            const deduction = bundleSize * item.quantity;
                            const stockRes = await client.query(
                                `UPDATE products SET stock = stock - $1 WHERE id = $2 RETURNING stock, name_he, name, original_size`,
                                [deduction, innerDbId]
                            );

                            if (stockRes.rows.length > 0) {
                                const { stock: currentStock, name_he, name, original_size } = stockRes.rows[0];
                                const pName = name_he || name;
                                const originalSize = Number(original_size) || 1000;
                                
                                if (currentStock < originalSize * 0.2) {
                                    if (!notifiedProducts.has(innerDbId)) {
                                        await client.query(
                                            `INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, $3)`,
                                            ['warning', `מלאי נמוך למוצר: ${pName} (נותרו \u200E${currentStock} מ"ל)`, false]
                                        );
                                        notifiedProducts.add(innerDbId);
                                    }
                                }
                            }
                        }
                    }

                    if ([2, 5, 10].includes(bundleSize)) {
                        const totalBottles = item.items.length * item.quantity;
                        const bottleRes = await client.query(
                            `UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = $2 RETURNING quantity`,
                            [totalBottles, bundleSize]
                        );

                        if (bottleRes.rows[0] && bottleRes.rows[0].quantity < 20) {
                            const sizeLabel = `${bundleSize}ml`;
                            await client.query(
                                `INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, $3)`,
                                ['warning', `מלאי בקבוקים נמוך: ${sizeLabel} (נותרו \u200E${bottleRes.rows[0].quantity})`, false]
                            );
                        }
                    }
                    continue;
                }

                // Calculate stock deduction
                let deduction = 0;
                if (!item.isPrize) {
                    if (item.is_discovery_set) {
                        deduction = item.quantity; // 1 unit per discovery set
                    } else if (!isNaN(item.size)) {
                        deduction = Number(item.size) * item.quantity;
                    }
                }

                if (deduction > 0) {
                    const stockRes = await client.query(
                        `UPDATE products SET stock = stock - $1 WHERE id = $2 RETURNING stock, name_he, name, original_size`,
                        [deduction, dbId]
                    );

                    // Low Stock Alert (Below 20%)
                    if (stockRes.rows.length > 0) {
                        const { stock: currentStock, name_he, name, original_size } = stockRes.rows[0];
                        const pName = name_he || name;
                        const originalSize = Number(original_size) || 1000;
                        
                        if (currentStock < originalSize * 0.2) {
                            if (!notifiedProducts.has(dbId)) {
                                const unitLabel = item.is_discovery_set ? 'יחידות' : 'מ"ל';
                                await client.query(
                                    `INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, $3)`,
                                    ['warning', `מלאי נמוך למוצר: ${pName} (נותרו \u200E${currentStock} ${unitLabel})`, false]
                                );
                                notifiedProducts.add(dbId);
                            }
                        }
                    }

                    // 5. Update Bottle Inventory (Skip for discovery sets)
                    if (!item.is_discovery_set && !isNaN(item.size)) {
                        const bottleSize = Number(item.size);
                        if ([2, 5, 10].includes(bottleSize)) {
                            const bottleRes = await client.query(
                                `UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = $2 RETURNING quantity`,
                                [item.quantity, bottleSize]
                            );

                            if (bottleRes.rows[0] && bottleRes.rows[0].quantity < 20) {
                                const sizeLabel = `${bottleSize}ml`;
                                // RTL Fix: wrap number in LRM \u200E
                                await client.query(
                                    `INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, $3)`,
                                    ['warning', `מלאי בקבוקים נמוך: ${sizeLabel} (נותרו \u200E${bottleRes.rows[0].quantity})`, false]
                                );
                            }
                        }
                    }
                }
            }

            await client.query('COMMIT');

            // 5. Send Emails
            try {
                const customerName = `${customer.first_name} ${customer.last_name}`;
                let deliveryText = 'איסוף עצמי (תל אביב)';
                if (deliveryMethod === 'mail') deliveryText = 'משלוח עד נקודת איסוף';
                else if (deliveryMethod === 'home_delivery') deliveryText = 'משלוח עד הבית';
                const shippingText = shippingCost === 0 ? 'חינם' : `${shippingCost} ₪`;

                const itemsHtmlCustomer = formatItemsHtmlCustomer(items);
                const itemsHtmlAdmin = formatItemsHtmlAdmin(items);
                const notesHtml = formatNotesHtml(notes);

                const confirmationHtml = getOrderConfirmationTemplate(orderId, itemsHtmlCustomer, total, 0, notesHtml, deliveryText, shippingText);
                await sendEmail(customer.email, `אישור הזמנה טלפונית #${orderId} - ml_tlv`, confirmationHtml, 'order_confirmation', orderId);

                const adminEmail = process.env.ADMIN_EMAIL;
                const adminAlertHtml = getAdminNewOrderTemplate(orderId, customerName, total, itemsHtmlAdmin, deliveryText, shippingText, phoneNumber || customer.phone);
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
