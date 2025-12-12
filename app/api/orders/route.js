import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import pool from '../../lib/db';

export async function POST(req) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { items, total, freeSamples } = body;

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Cart is empty' }, { status: 400 });
        }

        const client = await pool.connect();

        try {
            await client.query('BEGIN');

            // 1. Create Order
            // We save minimal user info snapshot for the order record
            const customerDetails = {
                clerk_id: userId,
                name: `${user.firstName} ${user.lastName}`,
                email: user.emailAddresses[0]?.emailAddress,
            };

            const orderResult = await client.query(
                `INSERT INTO orders (clerk_id, customer_details, total_amount, items, free_samples_count, status)
         VALUES ($1, $2, $3, $4, $5, 'pending')
         RETURNING id`,
                [userId, JSON.stringify(customerDetails), total, JSON.stringify(items), freeSamples]
            );

            const orderId = orderResult.rows[0].id;

            await client.query('COMMIT');

            return NextResponse.json({ success: true, orderId });

        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Order creation error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
