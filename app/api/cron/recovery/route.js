import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { sendEmail } from '@/app/lib/email';

export async function GET(req) {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await pool.connect();
        try {
            // 1. Find Abandoned Carts (> 3 hours ago, pending)
            const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

            const res = await client.query(`
                SELECT email, items, updated_at, recovery_status FROM abandoned_carts 
                WHERE updated_at < $1 
                AND recovery_status = 'pending'
                AND email IS NOT NULL
            `, [threeHoursAgo]);

            const carts = res.rows;
            console.log(`[Recovery Cron] Found ${carts.length} abandoned carts.`);

            if (carts.length === 0) {
                return NextResponse.json({ success: true, count: 0 });
            }

            let processed = 0;

            for (const cart of carts) {
                // 3. COOLDOWN CHECK: Check if user received a recovery coupon in the last 7 days
                const existingCoupons = await client.query(`
                    SELECT id FROM coupons 
                    WHERE email = $1 
                    AND code LIKE 'SAVE5-%' 
                    AND created_at > NOW() - INTERVAL '7 days'
                `, [cart.email]);

                if (existingCoupons.rows.length > 0) {
                    console.log(`[Recovery Cron] Skipping ${cart.email} (Cooldown active)`);
                    await client.query(`UPDATE abandoned_carts SET recovery_status = 'skipped_cooldown' WHERE email = $1`, [cart.email]);
                    continue;
                }

                // Generate Unique Coupon
                const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
                const couponCode = `SAVE5-${randomPart}`;

                // Insert Coupon
                await client.query(`
                    INSERT INTO coupons (code, discount_percent, expires_at, status, email)
                    VALUES ($1, 5, NOW() + INTERVAL '24 hours', 'active', $2)
                `, [couponCode, cart.email]);

                // Send Email via centralized utility
                const subject = 'שכחת משהו אצלנו... קח מתנה!';
                const html = `
                    <div dir="rtl" style="font-family: Arial, sans-serif; color: #333;">
                        <h2>ראינו שהשארת מספר פריטים בסל... 👀</h2>
                        <p>אנחנו שומרים לך עליהם, אבל המלאי מוגבל!</p>
                        <p>כדי להקל עליך, הנה קוד קופון מיוחד של <strong>5% הנחה</strong>:</p>
                        <div style="background: #f0fdf4; border: 2px dashed #16a34a; padding: 15px; text-align: center; margin: 20px 0;">
                            <h1 style="color: #16a34a; margin: 0;">${couponCode}</h1>
                            <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">תקף ל-24 השעות הקרובות בלבד!</p>
                        </div>
                        <p>
                            <a href="https://www.ml-tlv.com/cart" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                לחזרה לעגלה >>
                            </a>
                        </p>
                    </div>
                `;

                try {
                    await sendEmail(cart.email, subject, html, 'cart_recovery');

                    // Update Cart Status
                    await client.query(`
                        UPDATE abandoned_carts 
                        SET recovery_status = 'sent' 
                        WHERE email = $1
                    `, [cart.email]);

                    processed++;
                } catch (err) {
                    console.error(`Failed to send email to ${cart.email}:`, err);
                }
            }

            return NextResponse.json({ success: true, processed });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Recovery Job Error:', error);
        return NextResponse.json({ error: 'Job failed' }, { status: 500 });
    }
}
