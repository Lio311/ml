import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function DELETE(req, { params }) {
    try {
        const { id } = await params; // Await params in Next.js 15+
        const client = await pool.connect();
        try {
            await client.query('DELETE FROM coupons WHERE id = $1', [id]);
            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Delete Coupon Error:', error);
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { discount_percent, expires_at } = body;

        const client = await pool.connect();
        try {
            // Update fields that are passed
            // Note: usually we don't change code to avoid confusion, but we could if requested.
            // Here we stick to discount and expiry.

            // Note: 'updated_at' column does not exist in schema, so we skip it.
            // We start with a no-op update to simplify comma logic
            let query = 'UPDATE coupons SET id = id';
            const values = [];
            let idx = 1;

            if (discount_percent !== undefined) {
                query += `, discount_percent = $${idx++}`;
                values.push(discount_percent);
            }
            if (expires_at !== undefined) {
                query += `, expires_at = $${idx++}`;
                values.push(expires_at);
            }
            if (body.email !== undefined) {
                query += `, email = $${idx++}`;
                values.push(body.email);
            }
            if (body.limitations !== undefined) {
                query += `, limitations = $${idx++}`;
                values.push(JSON.stringify(body.limitations));
            }

            query += ` WHERE id = $${idx}`;
            values.push(id);

            await client.query(query, values);
            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update Coupon Error:', error);
        return NextResponse.json({ error: 'Failed to update' }, { status: 500 });
    }
}
