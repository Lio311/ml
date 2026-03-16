import pool from '../../../lib/db';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const { userId } = getAuth(req);
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        // Count all unread messages in conversations where the user is participant1
        // and the sender is NOT the user (meaning it's from admin/seller)
        const [rows] = await pool.query(`
            SELECT COUNT(*) as total_unread
            FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE c.participant1_id = $1
            AND m.sender_id != $2
            AND m.is_read = false
        `, [userId, userId]);

        const count = rows[0]?.total_unread || 0;

        return NextResponse.json({ count: parseInt(count) });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
