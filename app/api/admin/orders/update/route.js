import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import pool from '../../../../lib/db';
import { sendEmail, getOrderUpdatedTemplate } from '../../../../lib/email';
import { recordAuditLog } from '../../../../lib/audit';
import { checkAdmin } from '../../../../lib/admin';
import { getBrandName } from '../../../../lib/brand';

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
            const originalOrderRes = await client.query('SELECT items, customer_details, delivery_method, total_amount, catalog_id, free_samples_count FROM orders WHERE id = $1', [orderId]);
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

                if (item.type === 'bundle' && Array.isArray(item.items)) {
                    const bundleSize = Number(item.size) || 2;
                    for (const innerItem of item.items) {
                        let innerDbId = innerItem.id;
                        if (typeof innerDbId === 'string' && innerDbId.includes('-')) {
                            innerDbId = parseInt(innerDbId.split('-')[0]);
                        }
                        if (!isNaN(innerDbId)) {
                            const revertAmount = bundleSize * item.quantity;
                            await client.query(
                                'UPDATE products SET stock = stock + $1 WHERE id = $2',
                                [revertAmount, innerDbId]
                            );
                        }
                    }
                    if ([2, 5, 10].includes(bundleSize)) {
                        const totalBottles = item.items.length * item.quantity;
                        await client.query(
                            'UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = $2',
                            [totalBottles, bundleSize]
                        );
                    }
                } else if (!item.isPrize && !isNaN(item.size)) {
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
            // 2.5 Revert original free samples
            const originalSamples = originalOrder.free_samples_count || 0;
            if (originalSamples > 0) {
                await client.query('UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = 2', [originalSamples]);
            }

            // 3. Apply New Stock & Bottle Inventory
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

                            if (stockRes.rows.length === 0) continue;

                            const currentStock = stockRes.rows[0].stock;
                            if (currentStock < 0) {
                                const pName = stockRes.rows[0].name_he || stockRes.rows[0].name;
                                throw new Error(`אין מספיק מלאי למוצר במארז: ${pName}`);
                            }

                            const originalSize = Number(stockRes.rows[0].original_size || 100);
                            if (currentStock < originalSize * 0.2) {
                                const pName = stockRes.rows[0].name_he || stockRes.rows[0].name;
                                await client.query(
                                    `INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, $3)`,
                                    ['warning', `מלאי נמוך למוצר במארז (עקב עריכה): ${pName} (נותרו \u200E${currentStock} מ"ל)`, false]
                                );
                            }
                        }
                    }

                    if ([2, 5, 10].includes(bundleSize)) {
                        const totalBottles = item.items.length * item.quantity;
                        const bottleRes = await client.query(
                            `UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = $2 RETURNING quantity`,
                            [totalBottles, bundleSize]
                        );

                        if (bottleRes.rows[0] && bottleRes.rows[0].quantity < 0) {
                            throw new Error(`אין מספיק בקבוקים למארזים בגודל ${bundleSize}ml`);
                        }
                    }
                } else if (!item.isPrize && !isNaN(item.size)) {
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
            // 3.5 Recalculate Free Samples
            let newFreeSamplesCount = 0;
            const subtotal = total - (shippingCost || 0);
            
            if (originalOrder.catalog_id) {
                 const catRes = await client.query('SELECT settings FROM user_catalogs WHERE id = $1', [originalOrder.catalog_id]);
                 if (catRes.rows.length > 0) {
                     const settings = catRes.rows[0].settings || {};
                     let tiers = [];
                     try {
                         tiers = typeof settings.sample_tiers === 'string' ? JSON.parse(settings.sample_tiers) : (settings.sample_tiers || []);
                     } catch(e){}
                     if (tiers.length > 0) {
                         const sortedTiers = [...tiers].sort((a, b) => a.minAmount - b.minAmount);
                         const currentTier = sortedTiers.filter(t => subtotal >= t.minAmount).reverse()[0];
                         newFreeSamplesCount = currentTier ? currentTier.samplesCount : 0;
                     } else {
                         newFreeSamplesCount = originalOrder.free_samples_count || 0;
                     }
                 }
            } else {
                 if (subtotal >= 1000) newFreeSamplesCount = 6;
                 else if (subtotal >= 500) newFreeSamplesCount = 4;
                 else if (subtotal >= 300) newFreeSamplesCount = 2;
            }

            if (newFreeSamplesCount > 0) {
                await client.query('UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = 2', [newFreeSamplesCount]);
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
                     customer_details = $5,
                     free_samples_count = $6
                 WHERE id = $7`,
                [JSON.stringify(items), total, notes, deliveryMethod, JSON.stringify(updatedCustomerDetails), newFreeSamplesCount, orderId]
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
                    const oldMethod = originalOrder.delivery_method === 'mail' ? 'משלוח עד נקודת איסוף' : originalOrder.delivery_method === 'home_delivery' ? 'משלוח עד הבית' : 'איסוף עצמי';
                    const newMethod = deliveryMethod === 'mail' ? 'משלוח עד נקודת איסוף' : deliveryMethod === 'home_delivery' ? 'משלוח עד הבית' : 'איסוף עצמי';
                    changesSummary.push(`שיטת המסירה שונתה מ-${oldMethod} ל-${newMethod}`);
                }
                if ((originalOrder.free_samples_count || 0) !== newFreeSamplesCount) {
                    changesSummary.push(`כמות הדוגמיות במתנה עודכנה מ-${originalOrder.free_samples_count || 0} ל-${newFreeSamplesCount}`);
                }
                
                // Compare items to find exactly what changed
                const oldItemsMap = new Map();
                (originalOrder.items || []).forEach(item => {
                    const key = `${item.id}-${item.size}`;
                    oldItemsMap.set(key, item);
                });

                const newItemsMap = new Map();
                (items || []).forEach(item => {
                    const key = `${item.id}-${item.size}`;
                    newItemsMap.set(key, item);
                });

                oldItemsMap.forEach((oldItem, key) => {
                    const itemName = oldItem.name || `${oldItem.brand} ${oldItem.model}`;
                    const sizeText = oldItem.size ? `(${oldItem.size} מ"ל)` : '';
                    if (!newItemsMap.has(key)) {
                        changesSummary.push(`הוסר פריט: ${itemName} ${sizeText}`);
                    } else {
                        const newItem = newItemsMap.get(key);
                        if (oldItem.quantity !== newItem.quantity) {
                            changesSummary.push(`כמות עודכנה מ-${oldItem.quantity} ל-${newItem.quantity}: ${itemName} ${sizeText}`);
                        }
                    }
                });

                newItemsMap.forEach((newItem, key) => {
                    const itemName = newItem.name || `${newItem.brand} ${newItem.model}`;
                    const sizeText = newItem.size ? `(${newItem.size} מ"ל)` : '';
                    if (!oldItemsMap.has(key)) {
                        changesSummary.push(`נוסף פריט: ${itemName} ${sizeText} (כמות: ${newItem.quantity})`);
                    }
                });

                if (customerEmail) {
                    const updateHtml = getOrderUpdatedTemplate(orderId, customerName, items, total, deliveryMethod, shippingCost, notes, changesSummary);
                    const brandName = await getBrandName();
                    await sendEmail(customerEmail, `הזמנתך #${orderId} עודכנה - ${brandName}`, updateHtml, 'order_updated', orderId);
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
