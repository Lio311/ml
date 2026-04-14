import { NextResponse } from 'next/server';
import { auth as clerkAuth, currentUser } from '@clerk/nextjs/server';
import pool from '@/app/lib/db';
import { sendEmail, getTemplate, getOrderConfirmationTemplate, getAdminNewOrderTemplate } from '@/app/lib/email';
import { recordAuditLog } from '@/app/lib/audit';
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

                    const bottleSize = Number(item.size);
                    if ([2, 5, 10].includes(bottleSize)) {
                        const bottleRes = await client.query(
                            `UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = $2 RETURNING quantity`,
                            [item.quantity, bottleSize]
                        );

                        // Check Low Stock for Bottles
                        if (bottleRes.rows[0] && bottleRes.rows[0].quantity < 20) {
                            const sizeLabel = `${bottleSize}ml`;
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

            // Prepare dynamic item lists for templates
            const rowsHtmlCustomer = items.map(item => `
        <tr style="border-bottom: 1px solid #f5f5f5;">
            <td style="padding: 12px 10px; text-align: right; font-size: 14px; color: #333;">
                ${item.image_url ? `<img src="${item.image_url}" width="40" style="vertical-align: middle; margin-left: 10px; border-radius: 6px; display: inline-block; border: 1px solid #f0f0f0; height: auto; max-height: 40px; object-fit: contain;" alt="${item.name || 'product'}" />` : ''}
                <span style="vertical-align: middle;">${item.name || (item.brand + ' ' + item.model)} (${item.size} מ"ל)</span>
            </td>
            <td style="padding: 12px 10px; text-align: center; font-size: 14px; color: #333;">${item.quantity}</td>
            <td style="padding: 12px 10px; text-align: left; font-size: 14px; font-weight: bold; color: #000;">${item.price} ₪</td>
        </tr>
            `).join('');

            const itemsHtmlCustomer = `
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 25px;">
                    <thead>
                        <tr style="background-color: #f8f8f8; color: #999;">
                            <th style="padding: 12px 10px; text-align: right; font-size: 10px; font-weight: 900; text-transform: uppercase;">מוצר</th>
                            <th style="padding: 12px 10px; text-align: center; font-size: 10px; font-weight: 900; text-transform: uppercase;">כמות</th>
                            <th style="padding: 12px 10px; text-align: left; font-size: 10px; font-weight: 900; text-transform: uppercase;">מחיר</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${rowsHtmlCustomer}
                    </tbody>
                </table>`;

            const itemsHtmlAdmin = items.map(item => `
        <li style="margin-bottom: 12px; border-bottom: 1px solid #f0f0f0; padding-bottom: 12px; display: table; width: 100%;">
            ${item.image_url ? `<div style="display: table-cell; vertical-align: middle; width: 50px;"><img src="${item.image_url}" width="40" style="border-radius: 6px; border: 1px solid #f0f0f0; height: auto; max-height: 40px; object-fit: contain;" alt="product" /></div>` : ''}
            <div style="display: table-cell; vertical-align: middle;">
                <span style="font-weight: 900; color: #000;">${item.name || (item.brand + ' ' + item.model)}</span>
                <div style="font-size: 12px; color: #666;">${item.size || ''}ml x${item.quantity || 1}</div>
            </div>
        </li>
            `).join('');
            const deliveryText = deliveryMethod === 'self_pickup' ? 'איסוף עצמי (תל אביב)' : 'משלוח בדואר';
            
            const notesHtml = notes && notes.trim() !== '' ? `
                <div style="margin-top: 20px; background-color: #fffde7; padding: 15px 20px; border-radius: 16px; border: 1px dashed #fde047;">
                    <div style="font-size: 12px; font-weight: 900; color: #ca8a04; margin-bottom: 5px; text-transform: uppercase;">הערות להזמנה:</div>
                    <div style="font-size: 14px; color: #854d0e;">${notes}</div>
                </div>` : '';

            // Send Confirmation Email (Async, don't block response)
            const userEmail = user?.emailAddresses[0]?.emailAddress;
            const adminEmail = process.env.ADMIN_EMAIL;

            if (userEmail && !catalogId) {
                const { html: dynamicHtml, subject: dynamicSubject } = await getTemplate('order_confirmation', { 
                    orderId, 
                    total, 
                    freeSamples, 
                    notesHtml, 
                    customerName: user.firstName,
                    itemsHtml: itemsHtmlCustomer,
                    deliveryMethod: deliveryText,
                    shippingCost: shippingCost === 0 ? 'חינם' : `${shippingCost} ₪`
                }, getOrderConfirmationTemplate.bind(null, orderId, items, total, freeSamples, notes, deliveryMethod || 'mail', shippingCost));
                
                await sendEmail(userEmail, dynamicSubject || `אישור הזמנה #${orderId} - ml_tlv`, dynamicHtml, 'order_confirmation', orderId);
            } else if (userEmail && catalogId) {
                const { html: dynamicHtml, subject: dynamicSubject } = await getTemplate('order_confirmation', { 
                    orderId, 
                    total, 
                    freeSamples, 
                    notesHtml, 
                    customerName: user.firstName, 
                    catalogName,
                    itemsHtml: itemsHtmlCustomer,
                    deliveryMethod: deliveryText,
                    shippingCost: shippingCost === 0 ? 'חינם' : `${shippingCost} ₪`
                }, getOrderConfirmationTemplate.bind(null, orderId, items, total, freeSamples, notes, deliveryMethod || 'mail', shippingCost));
                
                await sendEmail(userEmail, dynamicSubject || `אישור קבלת פנייה מ${catalogName} #${orderId}`, dynamicHtml, 'order_confirmation', orderId);
            }

            // Send Admin and Catalog Owner Alerts
            const orderDateStr = new Intl.DateTimeFormat('he-IL', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Asia/Jerusalem' }).format(new Date());
            const customerFullName = `${user.firstName} ${user.lastName || ''}`.trim();
            const adminTmpl = await getTemplate('admin_order_alert', 
                { 
                    orderId, 
                    customerName: customerFullName,
                    name: customerFullName, 
                    total, 
                    deliveryMethod: deliveryText, 
                    shippingCost: `${shippingCost} ₪`, 
                    phone: phoneNumber,
                    phoneNumber: phoneNumber,
                    itemsHtml: itemsHtmlAdmin,
                    itemsHtmlAdmin: itemsHtmlAdmin,
                    orderDate: orderDateStr
                },
                () => getAdminNewOrderTemplate(orderId, customerFullName, total, items, deliveryMethod || 'mail', shippingCost, phoneNumber, orderDateStr)
            );
            
            if (catalogOwnerEmail) {
                // Send to catalog owner
                await sendEmail(catalogOwnerEmail, adminTmpl.subject, adminTmpl.html, 'admin_alert', orderId);
            }
            
            // Also send to main admin
            await sendEmail(adminEmail, adminTmpl.subject, adminTmpl.html, 'admin_alert', orderId);

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
