import pool from '../../../lib/db';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const { userId } = getAuth(req);
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get('orderId');

        if (!orderId) return new NextResponse('OrderId is required', { status: 400 });

        const result = await pool.query(`
            SELECT EXISTS (
                SELECT 1 FROM reviews 
                WHERE user_id = $1 AND order_id = $2
            ) as exists
        `, [userId, orderId]);

        return NextResponse.json({ exists: result.rows[0].exists });
    } catch (error) {
        console.error('Error checking review status:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
