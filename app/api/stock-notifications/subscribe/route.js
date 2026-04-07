import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { auth as clerkAuth, currentUser } from '@clerk/nextjs/server';

export async function POST(req) {
    try {
        const { userId } = await clerkAuth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized. Please sign in to subscribe.' }, { status: 401 });
        }

        const user = await currentUser();
        const email = user?.emailAddresses?.find(e => e.id === user.primaryEmailAddressId)?.emailAddress || user?.emailAddresses[0]?.emailAddress;

        if (!email) {
            return NextResponse.json({ error: 'Email not found for this user.' }, { status: 400 });
        }

        const body = await req.json();
        const { productId } = body;

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required.' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // Check if product exists and is indeed out of stock (optional but good)
            const prodCheck = await client.query('SELECT stock FROM products WHERE id = $1', [productId]);
            if (prodCheck.rows.length === 0) {
                return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
            }

            // Insert subscription
            await client.query(`
                INSERT INTO back_in_stock_subscriptions (product_id, user_id, user_email, status)
                VALUES ($1, $2, $3, 'pending')
                ON CONFLICT (product_id, user_id) 
                DO UPDATE SET status = 'pending', created_at = NOW()
            `, [productId, userId, email]);

            return NextResponse.json({ success: true, message: 'Subscribed successfully.' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Subscription Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
