import { NextResponse } from 'next/server';
import { auth as clerkAuth, currentUser } from '@clerk/nextjs/server';
import pool from '@/app/lib/db';
import { sendEmail, getTemplate, getOrderConfirmationTemplate, getAdminNewOrderTemplate, formatItemsHtmlCustomer, formatItemsHtmlAdmin, formatNotesHtml } from '@/app/lib/email';
import { recordAuditLog } from '@/app/lib/audit';
import { getBrandName } from '@/app/lib/brand';
import * as Sentry from "@sentry/nextjs";
import { notifyAdmin } from '@/app/lib/notifications';

export async function POST(req) {
    let userId = null;
    let user = null;
    let body = null;

    try {
        const authData = await clerkAuth();
        userId = authData?.userId;
        user = await currentUser();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        body = await req.json();
        const { items, total, freeSamples: clientFreeSamples, notes, deliveryMethod, phoneNumber, catalogId, couponCode, luckyPrize } = body;

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

            // --- SECURITY: Stock Validation ---
            let outOfStockItems = [];
            for (const item of items) {
                if (item.isPrize) continue;

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
                        if (isNaN(innerDbId)) continue;
                        
                        const stockRes = await client.query('SELECT stock FROM products WHERE id = $1 FOR UPDATE', [innerDbId]);
                        if (stockRes.rows.length > 0) {
                            const requiredVolume = Number(item.size) * item.quantity;
                            if (stockRes.rows[0].stock < requiredVolume) {
                                outOfStockItems.push({ id: innerItem.id, name: innerItem.name, size: item.size });
                            }
                        }
                    }
                    continue;
                }

                if (isNaN(dbId)) continue;

                const stockRes = await client.query('SELECT stock, is_discovery_set FROM products WHERE id = $1 FOR UPDATE', [dbId]);
                if (stockRes.rows.length > 0) {
                    const p = stockRes.rows[0];
                    let requiredVolume = 0;
                    if (p.is_discovery_set) {
                        requiredVolume = item.quantity; // 1 unit per quantity for discovery sets
                    } else {
                        requiredVolume = Number(item.size) * item.quantity;
                    }

                    if (p.stock < requiredVolume) {
                        outOfStockItems.push({ id: item.id, name: item.name, size: item.size });
                    }
                }
            }

            if (outOfStockItems.length > 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ 
                    error: 'OUT_OF_STOCK', 
                    message: 'One or more items are out of stock',
                    items: outOfStockItems 
                }, { status: 400 });
            }

            // --- SECURITY: Price Validation ---
            let calculatedTotal = 0;
            for (const item of items) {
                if (item.isPrize) {
                    if (Number(item.price) !== 0) throw new Error("Prize items must have a price of 0");
                    calculatedTotal += 0;
                    continue;
                }

                let dbId = item.id;
                if (typeof dbId === 'string' && dbId.includes('-')) {
                    dbId = parseInt(dbId.split('-')[0]);
                }

                if (item.type === 'bundle' && Array.isArray(item.items)) {
                    const bundleSize = Number(item.size) || 2;
                    let rawBundlePrice = 0;
                    for (const innerItem of item.items) {
                        let innerDbId = innerItem.id;
                        if (typeof innerDbId === 'string' && innerDbId.includes('-')) {
                            innerDbId = parseInt(innerDbId.split('-')[0]);
                        }
                        if (isNaN(innerDbId)) throw new Error(`Invalid inner item ID in bundle: ${innerItem.id}`);
                        
                        const pRes = await client.query('SELECT price_2ml, price_5ml, price_10ml, discount_percentage, discount_sizes FROM products WHERE id = $1', [innerDbId]);
                        if (pRes.rows.length === 0) throw new Error(`Product ${innerItem.name} (ID: ${innerDbId}) not found/active`);
                        
                        const p = pRes.rows[0];
                        let realPrice = 0;
                        if (bundleSize === 2) realPrice = p.price_2ml;
                        else if (bundleSize === 5) realPrice = p.price_5ml;
                        else if (bundleSize === 10) realPrice = p.price_10ml;
                        else throw new Error(`Invalid bundle size: ${bundleSize}`);

                        if (p.discount_percentage > 0 && Array.isArray(p.discount_sizes) && p.discount_sizes.includes(`${bundleSize}ml`)) {
                            realPrice = Math.round((realPrice * (1 - p.discount_percentage / 100)) / 5) * 5;
                        }
                        rawBundlePrice += realPrice;
                    }
                    const expectedBundlePrice = Math.round((rawBundlePrice * 0.9) / 5) * 5;
                    if (Math.abs(expectedBundlePrice - item.price) > 2) {
                        throw new Error(`Price mismatch for bundle ${item.name}: Expecting ${expectedBundlePrice}, got ${item.price}`);
                    }
                    calculatedTotal += item.price * item.quantity;
                    continue;
                }

                if (isNaN(dbId)) {
                    throw new Error(`Invalid item ID: ${item.id}`);
                }

                const pRes = await client.query('SELECT price_2ml, price_5ml, price_10ml, single_price, is_discovery_set, discount_percentage, discount_sizes FROM products WHERE id = $1', [dbId]);
                if (pRes.rows.length === 0) {
                    throw new Error(`Product ${item.name} (ID: ${dbId}) not found/active`);
                }
                
                const p = pRes.rows[0];
                let realPrice = 0;

                if (p.is_discovery_set) {
                    realPrice = p.single_price;
                } else {
                    if (Number(item.size) === 2) realPrice = p.price_2ml;
                    else if (Number(item.size) === 5) realPrice = p.price_5ml;
                    else if (Number(item.size) === 10) realPrice = p.price_10ml;
                    else {
                        throw new Error(`Invalid size for product ${item.name}: ${item.size}`);
                    }

                    // Apply individual product discount if applicable
                    if (p.discount_percentage > 0 && Array.isArray(p.discount_sizes) && p.discount_sizes.includes(`${item.size}ml`)) {
                        realPrice = Math.round((realPrice * (1 - p.discount_percentage / 100)) / 5) * 5;
                    }
                }
                
                if (realPrice !== item.price) {
                    // Allow small discrepancy (1 shekel) for rounding
                    if (Math.abs(realPrice - item.price) > 1) {
                        throw new Error(`Price mismatch for ${item.name}: Expecting ${realPrice}, got ${item.price}`);
                    }
                }
                calculatedTotal += item.price * item.quantity;
            }

            // --- Apply Limited Time Promo (Discovery Sets & Samples) ---
            const israelTime = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Jerusalem"}));
            const ilDayOfWeek = israelTime.getDay();
            const ilCurrentHour = israelTime.getHours();
            const isActivePromo = (ilDayOfWeek === 4) || (ilDayOfWeek === 5 && ilCurrentHour < 18);
            
            let promoDiscountAmount = 0;
            if (isActivePromo) {
                const discoverySets = [];
                const officialSamples = [];
                
                for (const item of items) {
                    if (item.is_discovery_set) {
                        for(let i=0; i<item.quantity; i++) {
                            if (item.discovery_type === 'official_sample') officialSamples.push(Number(item.price));
                            else discoverySets.push(Number(item.price));
                        }
                    }
                }
                
                discoverySets.sort((a,b) => a - b);
                const freeDiscoveryCount = Math.floor(discoverySets.length / 4);
                for(let i=0; i<freeDiscoveryCount; i++) {
                    promoDiscountAmount += discoverySets[i];
                }
                
                officialSamples.sort((a,b) => a - b);
                const freeSampleCount = Math.floor(officialSamples.length / 10) * 2;
                for(let i=0; i<freeSampleCount; i++) {
                    promoDiscountAmount += officialSamples[i];
                }
            }

            const priceAfterDiscounts = calculatedTotal - promoDiscountAmount;

            // --- SERVER-SIDE FREE SAMPLES VALIDATION ---
            let freeSamples = Number(clientFreeSamples) || 0;
            // Prevent malicious inventory drain
            const maxAllowedSamples = priceAfterDiscounts >= 1000 ? 6 : (priceAfterDiscounts >= 500 ? 4 : (priceAfterDiscounts >= 300 ? 2 : 0));
            if (freeSamples > maxAllowedSamples) {
                freeSamples = maxAllowedSamples;
            }

            // --- Mutually Exclusive Discounts Check ---
            if (couponCode && luckyPrize?.type === 'discount') {
                throw new Error('לא ניתן לממש קופון במקביל לזכייה בגלגל המזל / Cannot apply coupon with lucky prize');
            }

            // --- Apply Coupon Discount ---
            let discountAmount = 0;
            if (couponCode) {
                const coupRes = await client.query(`
                    SELECT code, discount_percent, limitations, email FROM coupons 
                    WHERE code = $1 AND status = 'active' AND (expires_at IS NULL OR expires_at > NOW())
                    FOR UPDATE
                `, [couponCode.toUpperCase()]);

                if (coupRes.rows.length === 0) {
                    throw new Error('קוד קופון לא תקין או פג תוקף');
                }

                const coupon = coupRes.rows[0];
                const limitations = coupon.limitations || {};

                // 1. Ownership Check
                const user = userId ? await currentUser() : null;
                const userEmail = user?.emailAddresses?.[0]?.emailAddress || body.customerDetails?.email;
                const isPersonal = coupon.email || (limitations.allowed_users && limitations.allowed_users.length > 0);
                
                if (isPersonal) {
                    if (!userEmail) throw new Error('הקופון הזה אינו זמין עבור משתמש זה');
                    const lowerEmail = userEmail.toLowerCase();
                    const matchesTopLevel = coupon.email && coupon.email.toLowerCase() === lowerEmail;
                    const matchesLimitations = Array.isArray(limitations.allowed_users) && limitations.allowed_users.some(u => {
                        const emailValue = typeof u === 'string' ? u : (u.id || u.email || u.value);
                        return emailValue && String(emailValue).toLowerCase() === lowerEmail;
                    });
                    
                    if (!matchesTopLevel && !matchesLimitations) {
                        throw new Error('הקופון הזה אינו זמין עבור משתמש זה');
                    }
                }

                // 2. Usage Check (Differentiate Public vs Personal)
                let usageQuery = "";
                let usageParams = [];

                if (isPersonal) {
                    // Personal coupon (assigned to an email): One use total ever
                    usageQuery = "SELECT id FROM orders WHERE coupon_code = $1 AND status != 'cancelled' LIMIT 1";
                    usageParams = [coupon.code];
                } else if (userEmail) {
                    // Public coupon: One use per customer (email based)
                    usageQuery = "SELECT id FROM orders WHERE coupon_code = $1 AND customer_details->>'email' = $2 AND status != 'cancelled' LIMIT 1";
                    usageParams = [coupon.code, userEmail];
                }

                if (usageQuery) {
                    const usageRes = await client.query(usageQuery, usageParams);
                    if (usageRes.rows.length > 0) {
                        throw new Error('קוד קופון זה כבר נוצל');
                    }
                }

                // 3. Min Total Check (subtotal of EVERYTHING in cart)
                const subtotalBeforeDiscount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                if (limitations.min_cart_total && subtotalBeforeDiscount < limitations.min_cart_total) {
                    throw new Error(`סכום מינימלי לשימוש בקופון זה הוא ${limitations.min_cart_total} ₪`);
                }

                // 4. Detailed Eligibility Check
                // Fetch product details for all items to check brand/category
                const itemDict = items.reduce((acc, item) => {
                    let cleanId = item.id;
                    if (typeof cleanId === 'string' && cleanId.includes('-')) cleanId = cleanId.split('-')[0];
                    acc[cleanId] = item;
                    return acc;
                }, {});

                const productIds = Object.keys(itemDict).filter(id => !isNaN(id)).map(id => parseInt(id));
                const productsRes = await client.query('SELECT id, brand, category FROM products WHERE id = ANY($1)', [productIds]);
                const productDataMap = productsRes.rows.reduce((acc, p) => {
                    acc[p.id] = p;
                    return acc;
                }, {});

                let eligibleSubtotal = 0;
                let hasEligibleItem = false;

                for (const item of items) {
                    if (item.type === 'bundle') continue;
                    if (isActivePromo && item.is_discovery_set) continue;

                    let cleanId = item.id;
                    if (typeof cleanId === 'string' && cleanId.includes('-')) cleanId = cleanId.split('-')[0];
                    const p = productDataMap[cleanId];

                    let isEligible = true;

                    // Size Check
                    if (limitations.allowed_sizes && limitations.allowed_sizes.length > 0) {
                        if (!limitations.allowed_sizes.includes(Number(item.size))) {
                            isEligible = false;
                        }
                    }

                    // Product Check
                    if (isEligible && limitations.allowed_products && limitations.allowed_products.length > 0) {
                        if (!limitations.allowed_products.includes(Number(cleanId))) {
                            isEligible = false;
                        }
                    }

                    // Brand Check
                    if (isEligible && limitations.allowed_brands && limitations.allowed_brands.length > 0) {
                        if (!p || !limitations.allowed_brands.includes(p.brand)) {
                            isEligible = false;
                        }
                    }

                    // Category Check
                    if (isEligible && limitations.allowed_categories && limitations.allowed_categories.length > 0) {
                        if (!p || !limitations.allowed_categories.includes(p.category)) {
                            isEligible = false;
                        }
                    }

                    if (isEligible) {
                        eligibleSubtotal += item.price * item.quantity;
                        hasEligibleItem = true;
                    }
                }

                if (!hasEligibleItem) {
                    throw new Error('קופון זה אינו חל על הפריטים בעגלה שלך');
                }

                const ratio = subtotalBeforeDiscount > 0 ? (priceAfterDiscounts / subtotalBeforeDiscount) : 1;
                const adjustedEligibleSubtotal = eligibleSubtotal * ratio;

                discountAmount = Math.round(adjustedEligibleSubtotal * (coupon.discount_percent / 100));
                calculatedTotal = priceAfterDiscounts - discountAmount;
            } else if (luckyPrize?.type === 'discount') {
                let eligibleSubtotal = 0;
                for (const item of items) {
                    if (item.type === 'bundle') continue;
                    if (isActivePromo && item.is_discovery_set) continue;
                    eligibleSubtotal += item.price * item.quantity;
                }

                const subtotalBeforeDiscount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
                const ratio = subtotalBeforeDiscount > 0 ? (priceAfterDiscounts / subtotalBeforeDiscount) : 1;
                const adjustedEligibleSubtotal = eligibleSubtotal * ratio;

                discountAmount = Math.round(adjustedEligibleSubtotal * luckyPrize.value);
                calculatedTotal = priceAfterDiscounts - discountAmount;
            } else {
                calculatedTotal = priceAfterDiscounts;
            }

            // Add shipping cost (0 for self_pickup, 30 for mail, 50 for home_delivery)
            let shippingCost = 0;
            if (deliveryMethod === 'mail') shippingCost = 30;
            else if (deliveryMethod === 'home_delivery') shippingCost = 50;
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
                INSERT INTO users (id, email, first_name, last_name, phone, role, address, created_at, updated_at, last_active_at)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
                ON CONFLICT (email) DO UPDATE SET
                    id = EXCLUDED.id,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    phone = EXCLUDED.phone,
                    role = EXCLUDED.role,
                    address = COALESCE(EXCLUDED.address, users.address),
                    updated_at = NOW(),
                    last_active_at = NOW()
            `, [userId, clerkEmail, clerkFirstName, clerkLastName, phoneNumber || '', clerkRole, body.address ? JSON.stringify(body.address) : null, clerkCreatedAt]);
            // ---------------------

            // 1. Create Order
            // We save minimal user info snapshot for the order record
            const customerDetails = {
                clerk_id: userId || null,
                name: body.customerDetails?.name || (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'אורח'),
                email: body.customerDetails?.email || (user ? user.emailAddresses[0].emailAddress : ''),
                phone: phoneNumber || '',
                shipping_cost: shippingCost || 0,
                address: body.address || null
            };

            const orderResult = await client.query(
                `INSERT INTO orders (customer_details, total_amount, items, free_samples_count, status, notes, delivery_method, catalog_id, coupon_code)
         VALUES ($1, $2, $3, $4, 'pending', $5, $6, $7, $8)
         RETURNING id`,
                [JSON.stringify(customerDetails), total, JSON.stringify(items), freeSamples, notes || '', deliveryMethod || 'mail', catalogId || null, couponCode || null]
            );

            const orderId = orderResult.rows[0].id;

            // 1.1 Insert Notification for Admin
            const customerFullName = body.customerDetails?.name || (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : 'אורח');
            await notifyAdmin('info', `הזמנה חדשה! #${orderId} - ${customerFullName}`, client);

            // 2. Update Stock
            for (const item of items) {
                // Fix for "74-2" composite ID bug
                let dbId = item.id;
                if (typeof dbId === 'string' && dbId.includes('-')) {
                    dbId = parseInt(dbId.split('-')[0]);
                }

                if (item.type === 'bundle' && Array.isArray(item.items)) {
                    // Deduct stock for each individual perfume inside the bundle
                    const bundleSize = Number(item.size) || 2; // Usually 2ml
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
                            
                            if (stockRes.rows[0]) {
                                const currentStock = stockRes.rows[0].stock;
                                const originalSize = Number(stockRes.rows[0].original_size || 100);
                                if (currentStock < originalSize * 0.2) {
                                    const pName = stockRes.rows[0].name_he || stockRes.rows[0].name || 'מוצר לא ידוע';
                                    await notifyAdmin('warning', `מלאי נמוך למוצר: ${pName} (נותרו \u200E${currentStock} מ"ל)`, client);
                                }
                            }
                        }
                    }
                    
                    // Deduct bottles for the entire bundle
                    if ([2, 5, 10].includes(bundleSize)) {
                        const totalBottles = item.items.length * item.quantity;
                        const bottleRes = await client.query(
                            `UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = $2 RETURNING quantity`,
                            [totalBottles, bundleSize]
                        );

                        if (bottleRes.rows[0] && bottleRes.rows[0].quantity < 20) {
                            await notifyAdmin('warning', `מלאי בקבוקים נמוך: ${bundleSize}ml (נותרו \u200E${bottleRes.rows[0].quantity})`, client);
                        }
                    }
                } else if (!item.isPrize && (!isNaN(item.size) || item.size === 'set' || item.is_discovery_set) && !isNaN(dbId)) {
                    const deduction = (item.size === 'set' || item.is_discovery_set) ? item.quantity : (Number(item.size) * item.quantity);
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
                            // RTL Fix: wrap number in LRM \u200E
                            await notifyAdmin('warning', `מלאי נמוך למוצר: ${pName} (נותרו \u200E${currentStock} מ"ל)`, client);
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
                            // RTL Fix: wrap number in LRM \u200E
                            await notifyAdmin('warning', `מלאי בקבוקים נמוך: ${sizeLabel} (נותרו \u200E${bottleRes.rows[0].quantity})`, client);
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

            // --- UPDATE PREORDERS (CONVERSION) ---
            const customerEmail = body.customerDetails?.email || (user ? user.emailAddresses[0]?.emailAddress : '');
            if (customerEmail) {
                const purchasedProductIds = [];
                for (const item of items) {
                    let dbId = item.id;
                    if (typeof dbId === 'string' && dbId.includes('-')) {
                        dbId = parseInt(dbId.split('-')[0]);
                    }
                    if (!isNaN(dbId)) purchasedProductIds.push(Number(dbId));
                    
                    // Check inside bundles
                    if (item.type === 'bundle' && Array.isArray(item.items)) {
                        for (const innerItem of item.items) {
                            let innerDbId = innerItem.id;
                            if (typeof innerDbId === 'string' && innerDbId.includes('-')) {
                                innerDbId = parseInt(innerDbId.split('-')[0]);
                            }
                            if (!isNaN(innerDbId)) purchasedProductIds.push(Number(innerDbId));
                        }
                    }
                }

                if (purchasedProductIds.length > 0) {
                    try {
                        await client.query(`
                            UPDATE preorders 
                            SET status = 'converted', converted_at = NOW()
                            WHERE LOWER(user_email) = LOWER($1) 
                            AND product_id = ANY($2)
                            AND status != 'converted'
                        `, [customerEmail, purchasedProductIds]);
                    } catch (e) {
                        console.error("Failed to update preorder conversion status:", e);
                    }
                }
            }

            await client.query('COMMIT');

            // Prepare dynamic item lists for templates
            const itemsHtmlCustomer = formatItemsHtmlCustomer(items);
            const itemsHtmlAdmin = formatItemsHtmlAdmin(items);
            let deliveryText = 'איסוף עצמי (תל אביב)';
            if (deliveryMethod === 'mail') deliveryText = 'משלוח עד נקודת איסוף';
            else if (deliveryMethod === 'home_delivery') deliveryText = 'משלוח עד הבית';
            const notesHtml = formatNotesHtml(notes);

            // Send Confirmation Email (Async, don't block response)
            const userEmail = user?.emailAddresses[0]?.emailAddress;
            const adminEmail = process.env.ADMIN_EMAIL;
            const brandName = await getBrandName();

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
                }, getOrderConfirmationTemplate.bind(null, orderId, items, total, freeSamples, notesHtml, deliveryText, shippingCost));
                
                await sendEmail(userEmail, dynamicSubject || `אישור הזמנה #${orderId} - ${brandName}`, dynamicHtml, 'order_confirmation', orderId);
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
                }, getOrderConfirmationTemplate.bind(null, orderId, items, total, freeSamples, notesHtml, deliveryText, shippingCost));
                
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
                () => getAdminNewOrderTemplate(orderId, customerFullName, total, items, deliveryText, shippingCost, phoneNumber, orderDateStr)
            );
            
            if (catalogOwnerEmail) {
                // Send to catalog owner
                await sendEmail(catalogOwnerEmail, adminTmpl.subject, adminTmpl.html, 'admin_alert', orderId, null, [], true);
            }
            
            // Also send to main admin
            await sendEmail(adminEmail, adminTmpl.subject, adminTmpl.html, 'admin_alert', orderId, null, [], true);

            // Record Audit Log
            await recordAuditLog({
                userId,
                action: 'create_order',
                entityType: 'order',
                entityId: orderId.toString(),
                details: { total, itemsCount: items.length, catalogId },
                req
            });

            // Sync visual workflow last_run state
            try {
                await client.query(`
                    UPDATE workflows 
                    SET last_run = NOW(), total_runs = total_runs + 1
                    WHERE name IN ('התראת הזמנה חדשה (למנהל)', 'אישור קבלת הזמנה')
                `);
            } catch (e) {
                console.error("Failed to sync workflow last_run:", e);
            }

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
        
        // Log to checkout_errors table
        if (userId) {
            try {
                const userEmail = user?.emailAddresses?.[0]?.emailAddress || body?.customerDetails?.email || '';
                const userName = body?.customerDetails?.name || (user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '');
                const userPhone = body?.phoneNumber || '';
                
                await pool.query(
                    `INSERT INTO checkout_errors (user_id, user_name, user_email, user_phone, error_message, cart_items, total_amount)
                     VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                    [
                        userId, 
                        userName, 
                        userEmail, 
                        userPhone, 
                        error.message || 'Unknown error', 
                        body?.items ? JSON.stringify(body.items) : null,
                        body?.total || 0
                    ]
                );
            } catch (logError) {
                console.error('Failed to log checkout error:', logError);
            }
        }

        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
