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

            // 1.1 Insert Notification for Admin
            await client.query(
                `INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, $3)`,
                ['info', `הזמנה חדשה! #${orderId} - ${user.firstName} ${user.lastName}`, false]
            );

            // 2. Update Stock
            for (const item of items) {
                // Fix for "74-2" composite ID bug
                let dbId = item.id;
                if (typeof dbId === 'string' && dbId.includes('-')) {
                    dbId = parseInt(dbId.split('-')[0]);
                }

                // Skip prizes (synthetic IDs) or non-numeric sizes (sets) if stock tracking is ML only
                if (!item.isPrize && !isNaN(item.size)) {
                    const deduction = Number(item.size) * item.quantity;
                    const stockRes = await client.query(
                        `UPDATE products SET stock = stock - $1 WHERE id = $2 RETURNING stock, name_he`,
                        [deduction, dbId]
                    );

                    // Check Low Stock for Product
                    if (stockRes.rows[0] && stockRes.rows[0].stock < 500) { // 500ml threshold (approx 10 bottles)
                        await client.query(
                            `INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, $3)`,
                            ['warning', `מלאי נמוך למוצר: ${stockRes.rows[0].name_he} (נותרו ${stockRes.rows[0].stock} מ"ל)`, false]
                        );
                    }

                    // --- BOTTLE INVENTORY DEDUCTION ---
                    // Deduct 1 bottle of this size for each unit quantity
                    let bottleSize = Number(item.size);

                    // Luxury Bottle Logic: 10ml & Price >= 300 -> Size 11
                    if (bottleSize === 10 && item.price >= 300) {
                        bottleSize = 11;
                    }

                    if ([2, 5, 10, 11].includes(bottleSize)) {
                        const bottleRes = await client.query(
                            `UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = $2 RETURNING quantity`,
                            [item.quantity, bottleSize]
                        );

                        // Check Low Stock for Bottles
                        if (bottleRes.rows[0] && bottleRes.rows[0].quantity < 20) {
                            const sizeLabel = bottleSize === 11 ? '10ml (יוקרתי)' : `${bottleSize}ml`;
                            await client.query(
                                `INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, $3)`,
                                ['warning', `מלאי בקבוקים נמוך: ${sizeLabel} (נותרו ${bottleRes.rows[0].quantity})`, false]
                            );
                        }
                    }
                }
            }

            // --- FREE SAMPLES DEDUCTION (2ml) ---
            if (freeSamples && freeSamples > 0) {
                await client.query(
                    `UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = 2`,
                    [freeSamples] // Assuming free samples are always 2ml
                );
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
