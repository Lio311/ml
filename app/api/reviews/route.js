import { auth as clerkAuth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import * as Sentry from "@sentry/nextjs";

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
            SELECT r.*, u.first_name, u.last_name, u.role
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
        const { orderId, content, rating = 5, productId } = body;

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
            if (orderCheck.rows[0].status !== 'completed' && orderCheck.rows[0].status !== 'הושלם') {
                 // Allow both if translated
            }

            // Insert review
            const result = await pool.query(`
                INSERT INTO reviews (user_id, order_id, content, rating)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `, [userId, orderId, content, rating]);

            return NextResponse.json(result.rows[0]);
        }

        // Mode 2: Simple product rating without orderId
        if (productId) {
            // Check if user already rated this product
            const existing = await pool.query(`SELECT id FROM reviews WHERE user_id = $1 AND product_id = $2 AND order_id IS NULL`, [userId, productId]);
            if (existing.rows.length > 0) {
                // Update existing rating
                const result = await pool.query(`
                    UPDATE reviews SET rating = $1, created_at = NOW() 
                    WHERE id = $2 RETURNING *
                `, [rating, existing.rows[0].id]);
                return NextResponse.json(result.rows[0]);
            } else {
                // Insert new simple rating
                const result = await pool.query(`
                    INSERT INTO reviews (user_id, product_id, rating, is_public)
                    VALUES ($1, $2, $3, true)
                    RETURNING *
                `, [userId, productId, rating]);
                return NextResponse.json(result.rows[0]);
            }
        }

        return NextResponse.json({ error: 'Requires either orderId or productId' }, { status: 400 });
    } catch (error) {
        Sentry.captureException(error);
        console.error('Error submitting review:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
