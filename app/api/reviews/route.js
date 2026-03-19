import { auth as clerkAuth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import * as Sentry from "@sentry/nextjs";

export async function GET() {
    try {
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
        const { orderId, content, rating = 5 } = body;

        if (!orderId || !content) {
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
    } catch (error) {
        Sentry.captureException(error);
        console.error('Error submitting review:', error);
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    }
}
