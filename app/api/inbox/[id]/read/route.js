import pool from '../../../../../lib/db';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function PATCH(req, { params }) {
    try {
        const { userId } = getAuth(req);
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const { id: conversationId } = params;

        // Verify conversation access
        const check = await pool.query(`SELECT * FROM conversations WHERE id = $1`, [conversationId]);
        if (check.rows.length === 0) return new NextResponse('Not Found', { status: 404 });
        
        const conv = check.rows[0];
        
        let isAuthorized = false;
        if (conv.participant1_id === userId || conv.participant2_id === userId || conv.participant2_id === 'admin') {
            isAuthorized = true;
        } else if (conv.catalog_id) {
            const catCheck = await pool.query(`SELECT user_id FROM catalogs WHERE id = $1`, [conv.catalog_id]);
            if (catCheck.rows.length > 0 && catCheck.rows[0].user_id === userId) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) return new NextResponse('Forbidden', { status: 403 });

        // Admin might be checking this, so verify if they are allowed to read everything
        // Mark all messages as read where sender != current user
        // If current user is a catalog owner reading, the sender works
        // If 'admin' is reading, userId is the admin's clerk ID which might not be participant2_id verbatim
        // So just mark anything not sent by the caller as read
        const update = await pool.query(`
            UPDATE messages 
            SET is_read = true 
            WHERE conversation_id = $1 AND sender_id != $2
            RETURNING id
        `, [conversationId, userId]);

        return NextResponse.json({ success: true, count: update.rowCount });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
