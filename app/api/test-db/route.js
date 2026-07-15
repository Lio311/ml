import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET(req) {
    const client = await pool.connect();
    try {
        const preorders = await client.query('SELECT * FROM preorders');
        const orders = await client.query('SELECT id, customer_details, items, created_at FROM orders ORDER BY created_at DESC LIMIT 5');
        return NextResponse.json({ preorders: preorders.rows, orders: orders.rows });
    } finally {
        client.release();
    }
}
