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
            if (coupon.email && userEmail && coupon.email.toLowerCase() !== userEmail.toLowerCase()) {
                return NextResponse.json({ error: 'הקופון הזה אינו זמין עבור משתמש זה' }, { status: 403 });
            }

            // 2. Single-Use Check (Orders)
            const usageRes = await client.query('SELECT id FROM orders WHERE coupon_code = $1 LIMIT 1', [coupon.code]);
            if (usageRes.rows.length > 0) {
                return NextResponse.json({ error: 'קוד קופון זה כבר נוצל' }, { status: 400 });
            }

            // 3. Minimum Total
            if (limitations.min_total && subtotal < limitations.min_total) {
                return NextResponse.json({ 
                    error: `סכום מינימלי לשימוש בקופון זה הוא ${limitations.min_total} ₪`,
                    min_total: limitations.min_total
                }, { status: 400 });
            }

            // 4. Product/Brand Restrictions
            if (items && items.length > 0 && (limitations.eligible_brands || limitations.eligible_products || limitations.excluded_products)) {
                // Fetch brands/ids for items to be sure
                const itemDict = items.reduce((acc, item) => {
                    let cleanId = item.id;
                    if (typeof cleanId === 'string' && cleanId.includes('-')) cleanId = cleanId.split('-')[0];
                    acc[cleanId] = item;
                    return acc;
                }, {});

                const productIds = Object.keys(itemDict).filter(id => !isNaN(id)).map(id => parseInt(id));
                const productsRes = await client.query('SELECT id, brand FROM products WHERE id = ANY($1)', [productIds]);
                const productsData = productsRes.rows;

                let isEligible = false;
                
                // If there's a whitelist, at least one item must match it
                // Or maybe ALL items must be eligible? Usually for a "specific product coupon" it's at least one.
                // But for "not eligible for items in cart" it might mean NONE of the items match.
                
                const matchesWhitelist = (p) => {
                    const brandMatch = !limitations.eligible_brands || limitations.eligible_brands.includes(p.brand);
                    const productMatch = !limitations.eligible_products || limitations.eligible_products.includes(p.id);
                    const notExcluded = !limitations.excluded_products || !limitations.excluded_products.includes(p.id);
                    return brandMatch && productMatch && notExcluded;
                };

                const eligibleItemsCount = productsData.filter(matchesWhitelist).length;
                if (eligibleItemsCount === 0) {
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
