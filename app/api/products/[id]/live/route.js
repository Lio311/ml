import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import * as Sentry from "@sentry/nextjs";

export async function GET(req, { params }) {
    const { id } = await params;
    
    if (!id || isNaN(parseInt(id))) {
        return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 });
    }

    const client = await pool.connect();
    try {
        const res = await client.query(
            'SELECT id, name, brand, model, image_url, stock, price_2ml, price_5ml, price_10ml, single_price, is_discovery_set, discount_percentage, discount_sizes FROM products WHERE id = $1',
            [parseInt(id)]
        );

        if (res.rows.length === 0) {
            return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        }

        return NextResponse.json(res.rows[0]);
    } catch (error) {
        Sentry.captureException(error);
        console.error('Live Product Fetch Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
