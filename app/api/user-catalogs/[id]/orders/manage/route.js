import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '@/app/lib/db';

export async function GET(req, context) {
    let client;
    try {
        const { userId } = await auth();
        const params = await context.params;
        const { id: catalogId } = params;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        client = await pool.connect();
        
        // Check ownership
        const catRes = await client.query('SELECT user_id FROM user_catalogs WHERE id = $1', [catalogId]);
        if (catRes.rows.length === 0 || catRes.rows[0].user_id !== userId) {
            return NextResponse.json({ error: 'Catalog not found or unauthorized' }, { status: 403 });
        }

        // Fetch orders
        const ordersRes = await client.query('SELECT * FROM orders WHERE catalog_id = $1 ORDER BY created_at DESC', [catalogId]);
        
        return NextResponse.json(ordersRes.rows);
    } catch (error) {
        console.error('Error fetching catalog orders:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}

export async function PUT(req, context) {
    let client;
    try {
        const { userId } = await auth();
        const params = await context.params;
        const { id: catalogId } = params;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { orderId, status } = body;

        if (!orderId || !status) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        client = await pool.connect();
        
        // Check ownership
        const catRes = await client.query('SELECT user_id FROM user_catalogs WHERE id = $1', [catalogId]);
        if (catRes.rows.length === 0 || catRes.rows[0].user_id !== userId) {
            return NextResponse.json({ error: 'Catalog not found or unauthorized' }, { status: 403 });
        }

        // Check order belongs to catalog
        const orderRes = await client.query('SELECT id FROM orders WHERE id = $1 AND catalog_id = $2', [orderId, catalogId]);
        if (orderRes.rows.length === 0) {
            return NextResponse.json({ error: 'Order not found for this catalog' }, { status: 404 });
        }

        // Update status
        await client.query('UPDATE orders SET status = $1 WHERE id = $2', [status, orderId]);
        
        return NextResponse.json({ success: true, message: 'Order status updated' });
    } catch (error) {
        console.error('Error updating catalog order status:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}
