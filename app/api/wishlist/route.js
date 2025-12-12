import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { auth } from '@clerk/nextjs/server';

// GET: Get user's wishlist product IDs
export async function GET(req) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ wishlist: [] });
    }

    try {
        const client = await pool.connect();
        try {
            const res = await client.query('SELECT product_id FROM wishlist WHERE user_id = $1', [userId]);
            return NextResponse.json({ wishlist: res.rows.map(r => r.product_id) });
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("Wishlist GET Error:", e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}

// POST: Toggle Wishlist Item
export async function POST(req) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { productId } = body;

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // Check if exists
            const check = await client.query('SELECT 1 FROM wishlist WHERE user_id = $1 AND product_id = $2', [userId, productId]);

            if (check.rows.length > 0) {
                // Remove
                await client.query('DELETE FROM wishlist WHERE user_id = $1 AND product_id = $2', [userId, productId]);
                return NextResponse.json({ inWishlist: false });
            } else {
                // Add
                await client.query('INSERT INTO wishlist (user_id, product_id) VALUES ($1, $2)', [userId, productId]);
                return NextResponse.json({ inWishlist: true });
            }
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("Wishlist POST Error:", e);
        return NextResponse.json({ error: 'Server Error' }, { status: 500 });
    }
}
