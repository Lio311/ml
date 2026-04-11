import { NextResponse } from 'next/server';
import { auth as clerkAuth, currentUser } from '@clerk/nextjs/server';
import pool from '../../lib/db';
import { sendEmail, getOrderConfirmationTemplate, getAdminNewOrderTemplate } from '../../lib/email';
import { recordAuditLog } from '../../lib/audit';
import * as Sentry from "@sentry/nextjs";

export async function POST(req) {
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        const user = await currentUser();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { items, total, freeSamples, notes, deliveryMethod, phoneNumber, catalogId, couponCode } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // Lazy migration: Ensure coupon_code column exists in orders
            try {
                await client.query('ALTER TABLE orders ADD COLUMN IF NOT EXISTS coupon_code TEXT');
            } catch (e) { /* Ignore */ }

            // --- SECURITY: Price Validation ---
            let calculatedTotal = 0;
            for (const item of items) {
                // Skip validation for special items (prizes/sets) for now, but strict validatation for standard catalog items
                // Real implementation should validate EVERYTHING.
                // Assuming standard items have numeric ID and numeric size
                let dbId = item.id;
                if (typeof dbId === 'string' && dbId.includes('-')) {
                    dbId = parseInt(dbId.split('-')[0]);
                }

                if (!item.isPrize && !isNaN(item.size) && !isNaN(dbId)) {
                    const pRes = await client.query('SELECT price_2ml, price_5ml, price_10ml, discount_percentage, discount_sizes FROM products WHERE id = $1', [dbId]);
                    if (pRes.rows.length === 0) {
                        throw new Error(`Product ${item.name} (ID: ${dbId}) not found/active`);
                    }
                    const p = pRes.rows[0];
                    let realPrice = 0;
                    if (Number(item.size) === 2) realPrice = p.price_2ml;
                    else if (Number(item.size) === 5) realPrice = p.price_5ml;
                    else if (Number(item.size) === 10) realPrice = p.price_10ml;
                    else {
                        // Fallback for sets or other sizes if logic exists
                        continue;
                    }

                    // Apply individual product discount if applicable
                    if (p.discount_percentage > 0 && Array.isArray(p.discount_sizes) && p.discount_sizes.includes(`${item.size}ml`)) {
                        realPrice = Math.round((realPrice * (1 - p.discount_percentage / 100)) / 5) * 5;
                    }
                    
                    if (realPrice !== item.price) {
                        // Allow small discrepancy (1 shekel) for rounding?
                        if (Math.abs(realPrice - item.price) > 1) {
                            throw new Error(`Price mismatch for ${item.name}: Expecting ${realPrice}, got ${item.price}`);
                        }
                    }
                    calculatedTotal += item.price * item.quantity;
                } else {
                    // Non-standard items or custom catalogs
                    calculatedTotal += item.price * item.quantity;
                }
            }

            // --- Apply Coupon Discount ---
            let discountAmount = 0;
            if (couponCode) {
                const coupRes = await client.query(`
                    SELECT code, discount_percent, limitations, email FROM coupons 
                    WHERE code = $1 AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW())
                `, [couponCode.toUpperCase()]);

                if (coupRes.rows.length === 0) {
                    throw new Error('קוד קופון לא תקין או פג תוקף');
                }

                const coupon = coupRes.rows[0];
                const limitations = coupon.limitations || {};

                // 1. Ownership Check
                const user = userId ? await currentUser() : null;
                const userEmail = user?.emailAddresses?.[0]?.emailAddress;
                if (coupon.email && userEmail && coupon.email.toLowerCase() !== userEmail.toLowerCase()) {
                    throw new Error('הקופון הזה אינו זמין עבור משתמש זה');
                }

                // 2. Single-Use Check
                const usageRes = await client.query('SELECT id FROM orders WHERE coupon_code = $1 LIMIT 1', [coupon.code]);
                if (usageRes.rows.length > 0) {
                    throw new Error('קוד קופון זה כבר נוצל');
                }

                // 3. Min Total Check (Already calculated subtotal from loop)
                const subtotalBeforeShipping = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                if (limitations.min_total && subtotalBeforeShipping < limitations.min_total) {
                    throw new Error(`סכום מינימלי לשימוש בקופון זה הוא ${limitations.min_total} ₪`);
                }

                // 4. Product/Brand Restrictions
                if (limitations.eligible_brands || limitations.eligible_products || limitations.excluded_products) {
                    const itemDict = items.reduce((acc, item) => {
                        let cleanId = item.id;
                        if (typeof cleanId === 'string' && cleanId.includes('-')) cleanId = cleanId.split('-')[0];
                        acc[cleanId] = item;
                        return acc;
                    }, {});

                    const productIds = Object.keys(itemDict).filter(id => !isNaN(id)).map(id => parseInt(id));
                    const productsRes = await client.query('SELECT id, brand FROM products WHERE id = ANY($1)', [productIds]);
                    const productsData = productsRes.rows;

                    const matchesWhitelist = (p) => {
                        const brandMatch = !limitations.eligible_brands || limitations.eligible_brands.includes(p.brand);
                        const productMatch = !limitations.eligible_products || limitations.eligible_products.includes(p.id);
                        const notExcluded = !limitations.excluded_products || !limitations.excluded_products.includes(p.id);
                        return brandMatch && productMatch && notExcluded;
                    };

                    const eligibleItemsCount = productsData.filter(matchesWhitelist).length;
                    if (eligibleItemsCount === 0) {
                        throw new Error('קופון זה אינו חל על הפריטים בעגלה שלך');
                    }
                }

                discountAmount = Math.round(subtotalBeforeShipping * (coupon.discount_percent / 100));
                calculatedTotal = subtotalBeforeShipping - discountAmount;
            }

            // Add shipping cost (0 for self_pickup, 30 for mail)
            const shippingCost = deliveryMethod === 'self_pickup' ? 0 : 30;
            calculatedTotal += shippingCost;

            // Verify Total (Allow 1 shekel diff for rounding discrepancies)
            if (Math.abs(calculatedTotal - total) > 1) {
                throw new Error(`Total amount mismatch. Calculated: ${calculatedTotal}, Received: ${total}`);
            }
            // ----------------------------------

            // Fetch catalog info early to get owner contact_email if applicable
            let catalogOwnerEmail = null;
            let catalogName = null;
            if (catalogId) {
                 const catRes = await client.query('SELECT name, contact_email FROM user_catalogs WHERE id = $1', [catalogId]);
                 if (catRes.rows.length > 0) {
                      catalogOwnerEmail = catRes.rows[0].contact_email;
                      catalogName = catRes.rows[0].name;
                 }
            }

            // --- JIT USER SYNC ---
            // Ensure the user exists in our local DB before creating the order
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
            // ---------------------

            // 1. Create Order
            // We save minimal user info snapshot for the order record
            const customerDetails = {
                clerk_id: userId || null,
                name: body.customerDetails?.name || (user ? `${user.firstName} ${user.lastName}` : ''),
                email: body.customerDetails?.email || (user ? user.emailAddresses[0].emailAddress : ''),
                phone: phoneNumber || '',
                shipping_cost: shippingCost || 0
            };

            const orderResult = await client.query(
                `INSERT INTO orders (customer_details, total_amount, items, free_samples_count, status, notes, delivery_method, catalog_id, coupon_code)
         VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8)
         RETURNING id`,
                [JSON.stringify(customerDetails), total, JSON.stringify(items), freeSamples, notes || '', deliveryMethod || 'mail', catalogId || null, couponCode || null]
            );

            const orderId = orderResult.rows[0].id;

            // 1.1 Insert Notification for Admin
            await client.query(
                `INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, $3)`,
                ['info', `הזמנה חדשה! #${orderId} - ${user.firstName} ${user.lastName}`, false]
            );

            // 2. Update Stock
            for (const item of items) {
                // Fix for "74-2" composite ID bug
                let dbId = item.id;
                if (typeof dbId === 'string' && dbId.includes('-')) {
                    dbId = parseInt(dbId.split('-')[0]);
                }

                // Skip prizes (synthetic IDs) or non-numeric sizes (sets) if stock tracking is ML only
                if (!item.isPrize && !isNaN(item.size)) {
                    const deduction = Number(item.size) * item.quantity;
                    const stockRes = await client.query(
                        `UPDATE products SET stock = stock - $1 WHERE id = $2 RETURNING stock, name_he, name, original_size`,
                        [deduction, dbId]
                    );

                    // Check Low Stock for Product (Dynamic 20% of original size)
                    if (stockRes.rows[0]) {
                        const currentStock = stockRes.rows[0].stock;
                        const originalSize = Number(stockRes.rows[0].original_size || 100);
                        const threshold = originalSize * 0.2; // 20% threshold

                        if (currentStock < threshold) {
                            const pName = stockRes.rows[0].name_he || stockRes.rows[0].name || 'מוצר לא ידוע';
                            await client.query(
                                `INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, $3)`,
                                ['warning', `מלאי נמוך למוצר: ${pName} (נותרו ${currentStock} מ"ל)`, false]
                            );
                        }
                    }

                    // --- BOTTLE INVENTORY DEDUCTION ---
                    // Deduct 1 bottle of this size for each unit quantity
                    let bottleSize = Number(item.size);

                    // Luxury Bottle Logic: 10ml & Price >= 300 -> Size 11
                    if (bottleSize === 10 && item.price >= 300) {
                        bottleSize = 11;
                    }

                    if ([2, 5, 10, 11].includes(bottleSize)) {
                        const bottleRes = await client.query(
                            `UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = $2 RETURNING quantity`,
                            [item.quantity, bottleSize]
                        );

                        // Check Low Stock for Bottles
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

            // --- FREE SAMPLES DEDUCTION (2ml) ---
            if (freeSamples && freeSamples > 0) {
                await client.query(
                    `UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = 2`,
                    [freeSamples] // Assuming free samples are always 2ml
                );
            }

            await client.query('COMMIT');

            // Send Confirmation Email (Async, don't block response)
            const userEmail = user?.emailAddresses[0]?.emailAddress;
            const adminEmail = process.env.ADMIN_EMAIL;

            if (userEmail && !catalogId) {
                const html = getOrderConfirmationTemplate(orderId, items, total, freeSamples, notes, deliveryMethod || 'mail', shippingCost);
                await sendEmail(userEmail, `אישור הזמנה #${orderId} - ml_tlv`, html, 'order_confirmation', orderId);
            } else if (userEmail && catalogId) {
                 // For catalog buyers, maybe send a different email? Or the same one. For now same one but with catalog context if we wanted
                const html = getOrderConfirmationTemplate(orderId, items, total, freeSamples, notes, deliveryMethod || 'mail', shippingCost);
                await sendEmail(userEmail, `אישור קבלת פנייה מ${catalogName} #${orderId}`, html, 'order_confirmation', orderId);
            }

            // Send Admin and Catalog Owner Alerts
            const adminHtml = getAdminNewOrderTemplate(orderId, `${user.firstName} ${user.lastName}`, total, items, deliveryMethod || 'mail', shippingCost, phoneNumber);
            
            if (catalogOwnerEmail) {
                // Send to catalog owner
                await sendEmail(catalogOwnerEmail, `הזמנה חדשה התקבלה בקטלוג שלך #${orderId} 🔥`, adminHtml, 'admin_alert', orderId);
            }
            
            // Also send to main admin
            await sendEmail(adminEmail, `חם מהתנור! הזמנה חדשה ${catalogId ? '(מקטלוג משתמש)' : ''} #${orderId} 🔥`, adminHtml, 'admin_alert', orderId);

            // Record Audit Log
            await recordAuditLog({
                userId,
                action: 'create_order',
                entityType: 'order',
                entityId: orderId.toString(),
                details: { total, itemsCount: items.length, catalogId },
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
        Sentry.captureException(error);
        console.error('Order creation error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
