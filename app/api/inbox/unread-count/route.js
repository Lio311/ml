import pool from '../../../lib/db';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        // Get user role for admin check
        const userRes = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        const isAdmin = userRes.rows[0]?.role === 'admin';

        // Count all unread messages where user is participant, or where participant2 is 'admin' and user is admin
        const { rows } = await pool.query(`
            SELECT COUNT(*) as total_unread
            FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE (
                c.participant1_id = $1 
                OR c.participant2_id = $1 
                OR ($2 = true AND c.participant2_id = 'admin')
            )
            AND m.sender_id != $1
            AND m.is_read = false
        `, [userId, isAdmin]);

        const count = rows[0]?.total_unread || 0;

        return NextResponse.json({ count: parseInt(count) });
    } catch (error) {
        console.error('Error fetching unread count:', error);
        return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 });
    }
}
