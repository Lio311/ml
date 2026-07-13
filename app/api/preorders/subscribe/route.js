import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function POST(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const user = await currentUser();
        const userEmail = user?.emailAddresses[0]?.emailAddress;

        const { productId } = await req.json();

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // Check if product exists and is_preorder
            const productRes = await client.query('SELECT is_preorder FROM products WHERE id = $1', [productId]);
            if (productRes.rows.length === 0 || !productRes.rows[0].is_preorder) {
                return NextResponse.json({ error: 'Product not available for preorder' }, { status: 400 });
            }

            // Check if already subscribed
            const existingRes = await client.query(
                'SELECT id FROM preorders WHERE product_id = $1 AND user_id = $2',
                [productId, userId]
            );

            if (existingRes.rows.length > 0) {
                return NextResponse.json({ success: true, message: 'Already subscribed' });
            }

            await client.query(
                'INSERT INTO preorders (product_id, user_id, user_email, status) VALUES ($1, $2, $3, $4)',
                [productId, userId, userEmail, 'pending']
            );

            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error in preorder subscription:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
