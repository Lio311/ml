import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function POST(req) {
    const { userId } = await auth();
    if (!userId) {
        return NextResponse.json({ message: 'User not logged in' }, { status: 200 }); // Silent return
    }

    try {
        const { productId } = await req.json();

        if (!productId) {
            return NextResponse.json({ error: 'Product ID required' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // Check if viewed recently (optional optimization, but simple insert is fine for now)
            await client.query(
                'INSERT INTO product_views (user_id, product_id) VALUES ($1, $2)',
                [userId, productId]
            );
            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('History Tracking Error:', error);
        return NextResponse.json({ error: 'Failed to record view' }, { status: 500 });
    }
}
