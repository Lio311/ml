import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import pool from '../../lib/db';
import { sendEmail, getOrderConfirmationTemplate } from '../../../lib/email';

export async function POST(req) {
    try {
        const { userId } = await auth();
        const user = await currentUser();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { items, total, freeSamples, notes } = body;

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
                `INSERT INTO orders (customer_details, total_amount, items, free_samples_count, status, notes)
         VALUES ($1, $2, $3, $4, 'pending', $5)
         RETURNING id`,
                [JSON.stringify(customerDetails), total, JSON.stringify(items), freeSamples, notes || '']
            );

            const orderId = orderResult.rows[0].id;

            // 2. Update Stock
            for (const item of items) {
                // Skip prizes (synthetic IDs) or non-numeric sizes (sets) if stock tracking is ML only
                if (!item.isPrize && !isNaN(item.size)) {
                    const deduction = Number(item.size) * item.quantity;
                    await client.query(
                        `UPDATE products SET stock = stock - $1 WHERE id = $2`,
                        [deduction, item.id]
                    );
                }
            }

            await client.query('COMMIT');

            // Send Confirmation Email (Async, don't block response)
            const userEmail = user?.emailAddresses[0]?.emailAddress;
            if (userEmail) {
                const html = getOrderConfirmationTemplate(orderId, items, total, freeSamples, notes);
                sendEmail(userEmail, `אישור הזמנה #${orderId} - ml_tlv`, html);
            }

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
