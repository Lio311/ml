import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import * as Sentry from "@sentry/nextjs";

export async function POST(req) {
    try {
        const origin = req.headers.get('origin') || req.headers.get('referer');
        const host = req.headers.get('host');
        if (origin && !origin.includes(host)) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const { code, subtotal, userEmail, items } = await req.json();

        if (!code) {
            return NextResponse.json({ error: 'Code required' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT id, code, discount_percent, expires_at, status, email, limitations FROM coupons 
                WHERE code = $1 
                AND status = 'active'
                AND (expires_at IS NULL OR expires_at > NOW())
            `, [code.toUpperCase()]);

            if (res.rows.length === 0) {
                return NextResponse.json({ error: 'קוד קופון לא תקין או פג תוקף' }, { status: 404 });
            }

            const coupon = res.rows[0];
            const limitations = coupon.limitations || {};

            // 1. Ownership Check (Email)
            const isPersonal = coupon.email || (limitations.allowed_users && limitations.allowed_users.length > 0);
            if (isPersonal) {
                if (!userEmail) {
                    return NextResponse.json({ error: 'personal_coupon_requires_email' }, { status: 403 });
                }
                const lowerEmail = userEmail.toLowerCase();
                const matchesTopLevel = coupon.email && coupon.email.toLowerCase() === lowerEmail;
                const matchesLimitations = Array.isArray(limitations.allowed_users) && limitations.allowed_users.some(u => {
                    const emailValue = typeof u === 'string' ? u : (u.id || u.email || u.value);
                    return emailValue && String(emailValue).toLowerCase() === lowerEmail;
                });
                
                if (!matchesTopLevel && !matchesLimitations) {
                    return NextResponse.json({ error: 'הקופון הזה אינו זמין עבור משתמש זה' }, { status: 403 });
                }
            }

            // 2. Usage Check (Differentiate Public vs Personal)
            let usageQuery = "";
            let usageParams = [];

            if (isPersonal) {
                // Personal coupon: One use total across the system
                usageQuery = "SELECT id FROM orders WHERE coupon_code = $1 AND status != 'cancelled' LIMIT 1";
                usageParams = [coupon.code];
            } else if (userEmail) {
                // Public coupon: One use per customer (based on email)
                usageQuery = "SELECT id FROM orders WHERE coupon_code = $1 AND customer_details->>'email' = $2 AND status != 'cancelled' LIMIT 1";
                usageParams = [coupon.code, userEmail];
            }

            if (usageQuery) {
                const usageRes = await client.query(usageQuery, usageParams);
                if (usageRes.rows.length > 0) {
                    return NextResponse.json({ error: 'קוד קופון זה כבר נוצל' }, { status: 400 });
                }
            }

            // 3. Minimum Total Check
            if (limitations.min_cart_total && subtotal < limitations.min_cart_total) {
                return NextResponse.json({ 
                    error: `סכום מינימלי לשימוש בקופון זה הוא ${limitations.min_cart_total} ₪`,
                    min_total: limitations.min_cart_total
                }, { status: 400 });
            }

            // 4. Product/Brand/Category/Size Restrictions
            if (items && items.length > 0) {
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

                let hasEligibleItem = false;

                for (const item of items) {
                    let cleanId = item.id;
                    if (typeof cleanId === 'string' && cleanId.includes('-')) cleanId = cleanId.split('-')[0];
                    const p = productDataMap[cleanId];

                    let itemIsEligible = true;

                    // Size Check
                    if (limitations.allowed_sizes && limitations.allowed_sizes.length > 0) {
                        if (!limitations.allowed_sizes.includes(Number(item.size))) {
                            itemIsEligible = false;
                        }
                    }

                    // Product Check
                    if (itemIsEligible && limitations.allowed_products && limitations.allowed_products.length > 0) {
                        if (!limitations.allowed_products.includes(Number(cleanId))) {
                            itemIsEligible = false;
                        }
                    }

                    // Brand Check
                    if (itemIsEligible && limitations.allowed_brands && limitations.allowed_brands.length > 0) {
                        if (!p || !limitations.allowed_brands.includes(p.brand)) {
                            itemIsEligible = false;
                        }
                    }

                    // Category Check
                    if (itemIsEligible && limitations.allowed_categories && limitations.allowed_categories.length > 0) {
                        if (!p || !limitations.allowed_categories.includes(p.category)) {
                            itemIsEligible = false;
                        }
                    }

                    if (itemIsEligible) {
                        hasEligibleItem = true;
                        break;
                    }
                }

                if (!hasEligibleItem) {
                    return NextResponse.json({ error: 'קופון זה אינו חל על הפריטים בעגלה שלך' }, { status: 400 });
                }
            }

            return NextResponse.json({
                success: true,
                coupon: {
                    code: coupon.code,
                    discount_type: 'percent',
                    discount_value: coupon.discount_percent,
                    limitations: limitations
                }
            });
        } finally {
            client.release();
        }
    } catch (error) {
        Sentry.captureException(error);
        console.error('Coupon Validation Error:', error);
        return NextResponse.json({ error: 'Validation failed' }, { status: 500 });
    }
}
