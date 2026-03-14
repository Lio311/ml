import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import pool from '@/app/lib/db';
import { revalidatePath } from 'next/cache';
import { sendEmail, getStatusUpdateTemplate } from '@/app/lib/email';

export async function POST(req) {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    const email = user?.emailAddresses[0]?.emailAddress;
    if (email !== 'lior31197@gmail.com' && role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let orderId, status;
    const contentType = req.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
        const body = await req.json();
        orderId = body.orderId;
        status = body.status;
    } else {
        const formData = await req.formData();
        orderId = formData.get('orderId');
        status = formData.get('status');
    }

    if (!orderId || !status) {
        return NextResponse.json({ error: 'Missing params' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        const res = await client.query('SELECT * FROM orders WHERE id = $1', [orderId]);
        const order = res.rows[0];
        if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 });

        const oldStatus = order.status;
        const newStatus = status;

        await client.query('UPDATE orders SET status = $1 WHERE id = $2', [newStatus, orderId]);

        // Bottle inventory logic
        if (newStatus === 'cancelled' && oldStatus !== 'cancelled') {
            for (const item of (order.items || [])) {
                if (!item.isPrize && !isNaN(item.size)) {
                    let bSize = Number(item.size);
                    if (bSize === 10 && item.price >= 300) bSize = 11;
                    if ([2, 5, 10, 11].includes(bSize)) {
                        await client.query('UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = $2', [item.quantity, bSize]);
                    }
                }
            }
            if (order.free_samples_count > 0) {
                await client.query('UPDATE bottle_inventory SET quantity = quantity + $1 WHERE size = 2', [order.free_samples_count]);
            }
        }
        if (oldStatus === 'cancelled' && newStatus !== 'cancelled') {
            for (const item of (order.items || [])) {
                if (!item.isPrize && !isNaN(item.size)) {
                    let bSize = Number(item.size);
                    if (bSize === 10 && item.price >= 300) bSize = 11;
                    if ([2, 5, 10, 11].includes(bSize)) {
                        await client.query('UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = $2', [item.quantity, bSize]);
                    }
                }
            }
            if (order.free_samples_count > 0) {
                await client.query('UPDATE bottle_inventory SET quantity = quantity - $1 WHERE size = 2', [order.free_samples_count]);
            }
        }

        // Email
        if (order.customer_details?.email) {
            try {
                const html = getStatusUpdateTemplate(orderId, newStatus, order.customer_details.name);
                await sendEmail(order.customer_details.email, `עדכון סטטוס הזמנה #${orderId} - ml`, html);
            } catch (e) { console.error('Email error:', e); }
        }

        revalidatePath('/admin/orders');
        return NextResponse.json({ success: true });
    } finally {
        client.release();
    }
}
