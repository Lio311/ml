import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { auth } from '@clerk/nextjs/server';

// GET: Fetch reviews for a product or get average
export async function GET(req) {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get('productId');
    const myReview = searchParams.get('myReview'); // To fetch user's own review
    const { userId } = await auth();

    if (!productId) {
        return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
    }

    try {
        const client = await pool.connect();
        try {
            if (myReview && userId) {
                const res = await client.query('SELECT rating FROM reviews WHERE user_id = $1 AND product_id = $2', [userId, productId]);
                return NextResponse.json({ rating: res.rows[0]?.rating || 0 });
            }

            // Get Average and Count
            const res = await client.query(`
                SELECT AVG(rating) as average, COUNT(*) as count 
                FROM reviews 
                WHERE product_id = $1
            `, [productId]);

            return NextResponse.json({
                average: parseFloat(res.rows[0].average || 0).toFixed(1),
                count: parseInt(res.rows[0].count)
            });
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("Reviews API Error:", e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

// POST: Add or Update Review
export async function POST(req) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { productId, rating } = body;

        if (!productId || !rating || rating < 1 || rating > 5) {
            return NextResponse.json({ error: 'Invalid data' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            await client.query(`
                INSERT INTO reviews (user_id, product_id, rating)
                VALUES ($1, $2, $3)
                ON CONFLICT (user_id, product_id) 
                DO UPDATE SET rating = EXCLUDED.rating, created_at = NOW()
            `, [userId, productId, rating]);

            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("Post Review Error:", e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
