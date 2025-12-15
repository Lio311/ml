import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import nodemailer from 'nodemailer';

export async function GET(req) {
    // Basic Security: Check for CRON_SECRET if desired, but for now open (or manual trigger).
    // const authHeader = req.headers.get('authorization');
    // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) { ... }

    try {
        const client = await pool.connect();
        try {
            // 1. Find Abandoned Carts (> 3 hours ago, pending)
            // For testing I can use > 1 minute if needed, but requirements say 3 hours.
            // 1. Find Abandoned Carts (> 3 hours ago, pending)
            const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString();

            const res = await client.query(`
                SELECT * FROM abandoned_carts 
                WHERE updated_at < $1 
                AND recovery_status = 'pending'
                AND email IS NOT NULL
            `, [threeHoursAgo]);

            const carts = res.rows;
            console.log(`[Recovery Cron] Found ${carts.length} abandoned carts.`);

            if (carts.length === 0) {
                return NextResponse.json({ success: true, count: 0 });
            }

            // 2. Setup Mail Transporter
            const transporter = nodemailer.createTransport({
                service: 'gmail', // Or use host/port from env
                auth: {
                    user: process.env.EMAIL_USER, // e.g., 'mybrand@gmail.com'
                    pass: process.env.EMAIL_PASS  // App Password
                }
            });

            let processed = 0;

            for (const cart of carts) {
                // Generate Unique Coupon
                const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
                const couponCode = `SAVE5-${randomPart}`;

                // Insert Coupon
                // Expires in 24 hours
                await client.query(`
                    INSERT INTO coupons (code, discount_percent, expires_at, status, email)
                    VALUES ($1, 5, NOW() + INTERVAL '24 hours', 'active', $2)
                `, [couponCode, cart.email]);

                // Send Email
                const mailOptions = {
                    from: process.env.EMAIL_USER,
                    to: cart.email,
                    subject: 'שכחת משהו אצלנו... קח מתנה!',
                    html: `
                        <div dir="rtl" style="font-family: Arial, sans-serif; color: #333;">
                            <h2>ראינו שהשארת מספר פריטים בסל... 👀</h2>
                            <p>אנחנו שומרים לך עליהם, אבל המלאי מוגבל!</p>
                            <p>כדי להקל עליך, הנה קוד קופון מיוחד של <strong>5% הנחה</strong>:</p>
                            <div style="background: #f0fdf4; border: 2px dashed #16a34a; padding: 15px; text-align: center; margin: 20px 0;">
                                <h1 style="color: #16a34a; margin: 0;">${couponCode}</h1>
                                <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">תקף ל-24 השעות הקרובות בלבד!</p>
                            </div>
                            <p>
                                <a href="https://ml-tlv.vercel.app/cart" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                    לחזרה לעגלה >>
                                </a>
                            </p>
                        </div>
                    `
                };

                try {
                    await transporter.sendMail(mailOptions);

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
