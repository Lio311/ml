import { NextResponse } from 'next/server';
import { auth as clerkAuth, clerkClient } from '@clerk/nextjs/server';
import pool from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    let client;
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userId);
        if (user.publicMetadata?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        client = await pool.connect();

        // Fetch all orders that belong to a user catalog
        const res = await client.query(`
            SELECT o.*, c.name as catalog_name, c.user_id as catalog_owner_id
            FROM orders o
            JOIN user_catalogs c ON o.catalog_id = c.id
            ORDER BY o.created_at DESC
        `);

        return NextResponse.json(res.rows);
    } catch (e) {
        console.error('Error fetching global catalog orders:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}

export async function PUT(req) {
    let client;
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userId);
        if (user.publicMetadata?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { orderId, status } = body;

        if (!orderId || !status) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }

        client = await pool.connect();

        // Fetch order details
        const orderRes = await client.query('SELECT status, items, catalog_id FROM orders WHERE id = $1 AND catalog_id IS NOT NULL', [orderId]);
        if (orderRes.rows.length === 0) {
             return NextResponse.json({ error: 'Order not found or is not a catalog order' }, { status: 404 });
        }

        const oldStatus = orderRes.rows[0].status;
        const items = typeof orderRes.rows[0].items === 'string' ? JSON.parse(orderRes.rows[0].items) : orderRes.rows[0].items;
        const catalogId = orderRes.rows[0].catalog_id;

        try {
            await client.query('BEGIN');
            
            await client.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);

            // Stock restoration logic
            if (status === 'cancelled' && oldStatus !== 'cancelled') {
                for (const item of items) {
                    const vol = (Number(item.quantity) || 1) * (parseFloat(String(item.size)) || 0);
                    const dbItemId = item.originalId || parseInt(String(item.id));
                    if (vol > 0 && dbItemId) {
                        await client.query(
                            'UPDATE user_catalog_items SET stock_ml = stock_ml + $1 WHERE id = $2 AND catalog_id = $3',
                            [vol, dbItemId, catalogId]
                        );
                    }
                }
            } else if (oldStatus === 'cancelled' && status !== 'cancelled') {
                for (const item of items) {
                    const vol = (Number(item.quantity) || 1) * (parseFloat(String(item.size)) || 0);
                    const dbItemId = item.originalId || parseInt(String(item.id));
                    if (vol > 0 && dbItemId) {
                        await client.query(
                            'UPDATE user_catalog_items SET stock_ml = GREATEST(0, stock_ml - $1) WHERE id = $2 AND catalog_id = $3',
                            [vol, dbItemId, catalogId]
                        );
                    }
                }
            }

            await client.query('COMMIT');
            return NextResponse.json({ success: true });
        } catch (txErr) {
            await client.query('ROLLBACK');
            throw txErr;
        }
    } catch (e) {
        console.error('Error updating catalog order status globally:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}
export async function DELETE(req) {
    let client;
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const clerk = await clerkClient();
        const user = await clerk.users.getUser(userId);
        if (user.publicMetadata?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) {
            return NextResponse.json({ error: 'Missing orderId' }, { status: 400 });
        }

        client = await pool.connect();

        // Verify it's a catalog order and get details
        const orderRes = await client.query('SELECT status, items, catalog_id FROM orders WHERE id = $1 AND catalog_id IS NOT NULL', [orderId]);
        if (orderRes.rows.length === 0) {
            return NextResponse.json({ error: 'Order not found or is not a catalog order' }, { status: 404 });
        }

        const { status, items, catalog_id } = orderRes.rows[0];
        const parsedItems = typeof items === 'string' ? JSON.parse(items) : items;

        try {
            await client.query('BEGIN');

            // Restore stock IF order was NOT already cancelled
            if (status !== 'cancelled') {
                for (const item of parsedItems) {
                    const vol = (Number(item.quantity) || 1) * (parseFloat(String(item.size)) || 0);
                    const dbItemId = item.originalId || parseInt(String(item.id));
                    if (vol > 0 && dbItemId) {
                        await client.query(
                            'UPDATE user_catalog_items SET stock_ml = stock_ml + $1 WHERE id = $2 AND catalog_id = $3',
                            [vol, dbItemId, catalog_id]
                        );
                    }
                }
            }

            await client.query('DELETE FROM orders WHERE id = $1', [orderId]);
            
            await client.query('COMMIT');
            return NextResponse.json({ success: true });
        } catch (txErr) {
            await client.query('ROLLBACK');
            throw txErr;
        }
    } catch (e) {
        console.error('Error deleting catalog order globally:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}
