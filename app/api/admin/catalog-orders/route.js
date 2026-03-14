import { NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import pool from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    let client;
    try {
        const { userId } = await auth();
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
        const { userId } = await auth();
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

        // Verify it's a catalog order
        const check = await client.query('SELECT id FROM orders WHERE id = $1 AND catalog_id IS NOT NULL', [orderId]);
        if (check.rows.length === 0) {
             return NextResponse.json({ error: 'Order not found or is not a catalog order' }, { status: 404 });
        }

        await client.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
        
        return NextResponse.json({ success: true });
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
        const { userId } = await auth();
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

        // Verify it's a catalog order before deleting
        const check = await client.query('SELECT id FROM orders WHERE id = $1 AND catalog_id IS NOT NULL', [orderId]);
        if (check.rows.length === 0) {
            return NextResponse.json({ error: 'Order not found or is not a catalog order' }, { status: 404 });
        }

        await client.query('DELETE FROM orders WHERE id = $1', [orderId]);
        
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error('Error deleting catalog order globally:', e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}
