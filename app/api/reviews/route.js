import { auth as clerkAuth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { recordAuditLog } from '@/app/lib/audit';
import * as Sentry from "@sentry/nextjs";
import nodemailer from 'nodemailer';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const productId = searchParams.get('productId');
        const myReview = searchParams.get('myReview');

        if (productId) {
            if (myReview === 'true') {
                const authData = await clerkAuth();
                const userId = authData?.userId;
                if (!userId) return NextResponse.json({ rating: 0 });
                
                const result = await pool.query(`
                    SELECT rating FROM reviews 
                    WHERE user_id = $1 AND product_id = $2 
                    ORDER BY created_at DESC LIMIT 1
                `, [userId, productId]);
                
                return NextResponse.json({ rating: result.rows[0]?.rating || 0 });
            } else {
                const result = await pool.query(`
                    SELECT ROUND(AVG(rating), 1) as average, COUNT(id) as count 
                    FROM reviews 
                    WHERE product_id = $1 AND rating IS NOT NULL
                `, [productId]);
                
                return NextResponse.json({ 
                    average: parseFloat(result.rows[0]?.average || 0), 
                    count: parseInt(result.rows[0]?.count || 0) 
                });
            }
        }

        // Fetch all reviews with user details
        const result = await pool.query(`
            SELECT r.id, r.user_id, r.order_id, r.product_id, r.content, r.rating, r.created_at, r.is_public, r.image_url,
                   u.first_name, u.last_name, u.role
            FROM reviews r
            LEFT JOIN users u ON r.user_id = u.id
            WHERE r.is_public = TRUE
            ORDER BY r.created_at DESC
        `);

        // Get Clerk profile images separately since they aren't in our DB
        const client = await clerkClient();
        const reviewsWithImages = await Promise.all(result.rows.map(async (review) => {
            try {
                const user = await client.users.getUser(review.user_id);
                return {
                    ...review,
                    user_image: user.imageUrl,
                    user_name: `${user.firstName} ${user.lastName}`.trim() || review.first_name || 'לקוח'
                };
            } catch (err) {
                return {
                    ...review,
                    user_image: null,
                    user_name: review.first_name || 'לקוח'
                };
            }
        }));

        return NextResponse.json(reviewsWithImages);
    } catch (error) {
        Sentry.captureException(error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await req.json();
        const { orderId, content, rating = 5, productId, image_url } = body;

        // Mode 1: Full review with orderId
        if (orderId) {
            if (!content) {
                return NextResponse.json({ error: 'OrderId and Content are required' }, { status: 400 });
            }

            // Verify order belongs to user and is completed
            const orderCheck = await pool.query("SELECT status FROM orders WHERE id = $1 AND customer_details->>'clerk_id' = $2", [orderId, userId]);
            if (orderCheck.rows.length === 0) {
                return NextResponse.json({ error: 'Order not found or unauthorized' }, { status: 404 });
            }

            // Insert review
            const result = await pool.query(`
                INSERT INTO reviews (user_id, order_id, content, rating, image_url)
                VALUES ($1, $2, $3, $4, $5)
                RETURNING id, user_id, order_id, content, rating, created_at, image_url
            `, [userId, orderId, content, rating, image_url]);

            const insertedReview = result.rows[0];

            await recordAuditLog({
                userId,
                action: 'create_review',
                entityType: 'review',
                entityId: insertedReview.id.toString(),
                details: { orderId, rating, contentLength: content?.length },
                req
            });

            // Reward logic: Check if a coupon is already rewarded for this order
            const orderDetailsCheck = await pool.query("SELECT customer_details, coupon_rewarded FROM orders WHERE id = $1", [orderId]);
            const orderData = orderDetailsCheck.rows[0];
            
            if (orderData && orderData.coupon_rewarded === false && orderData.customer_details?.email) {
                const customerEmail = orderData.customer_details.email;
                const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
                const couponCode = `SAVE10-${randomPart}`;

                // Insert Coupon (10% discount, 7 days valid)
                await pool.query(`
                    INSERT INTO coupons (code, discount_percent, expires_at, status, email)
                    VALUES ($1, 10, NOW() + INTERVAL '7 days', 'active', $2)
                `, [couponCode, customerEmail]);

                // Update order to mark rewarded
                await pool.query(`UPDATE orders SET coupon_rewarded = true WHERE id = $1`, [orderId]);

                // Send email
                const transporter = nodemailer.createTransport({
                    service: 'gmail',
                    auth: {
                        user: process.env.EMAIL_USER,
                        pass: process.env.EMAIL_PASS
                    }
                });
                
                try {
                    await transporter.sendMail({
                        from: process.env.EMAIL_USER,
                        to: customerEmail,
                        subject: 'תודה על חוות הדעת! הנה מתנה מאיתנו 🎁',
                        html: `
                            <div dir="rtl" style="font-family: Arial, sans-serif; color: #333; text-align: right;">
                                <h2>תודה רבה על הדירוג!</h2>
                                <p>אנחנו מעריכים מאוד את המשוב שעוזר ללקוחות אחרים למצוא את הבושם המושלם.</p>
                                <p>כדי להגיד תודה, הנה קוד קופון של <strong>10% הנחה</strong> לקנייה הבאה שלך:</p>
                                <div style="background: #f0fdf4; border: 2px dashed #16a34a; padding: 15px; text-align: center; margin: 20px 0;">
                                    <h1 style="color: #16a34a; margin: 0;">${couponCode}</h1>
                                    <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">תקף ל-7 ימים הקרובים בלבד!</p>
                                </div>
                                <p><a href="https://www.ml-tlv.com" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">לחזרה לחנות</a></p>
                            </div>
                        `
                    });
                } catch (e) {
                    console.error("Failed to send review reward email:", e);
                }
            }

            return NextResponse.json(insertedReview);
        }

        // Mode 2: Simple product rating without orderId
        if (productId) {
            // Check if user already rated this product
            const existing = await pool.query(`SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2 AND order_id IS NULL`, [userId, productId]);
            
            if (existing.rows.length > 0) {
                // Update existing rating
                const result = await pool.query(`
                    UPDATE reviews SET rating = $1, created_at = NOW() 
                    WHERE id = $2 
                    RETURNING id, rating, created_at
                `, [rating, existing.rows[0].id]);
                
                const updatedRating = result.rows[0];
                await recordAuditLog({
                    userId,
                    action: 'update_product_rating',
                    entityType: 'review',
                    entityId: updatedRating.id.toString(),
                    details: { productId, rating },
                    req
                });
                
                return NextResponse.json(updatedRating);
            } else {
                // Insert new simple rating
                const result = await pool.query(`
                    INSERT INTO reviews (user_id, product_id, rating, is_public)
                    VALUES ($1, $2, $3, true)
                    RETURNING id, user_id, product_id, rating, created_at, is_public
                `, [userId, productId, rating]);

                const insertedRating = result.rows[0];
                await recordAuditLog({
                    userId,
                    action: 'create_product_rating',
                    entityType: 'review',
                    entityId: insertedRating.id.toString(),
                    details: { productId, rating },
                    req
                });

                return NextResponse.json(insertedRating);
            }
        }

        return NextResponse.json({ error: 'Requires either orderId or productId' }, { status: 400 });
    } catch (error) {
        Sentry.captureException(error);
        console.error('Error submitting review:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
