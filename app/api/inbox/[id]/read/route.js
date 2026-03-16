import { db } from '@vercel/postgres';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function PATCH(req, { params }) {
    try {
        const { userId } = getAuth(req);
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const { id: conversationId } = params;

        // Verify conversation access
        const check = await db.sql`SELECT * FROM conversations WHERE id = ${conversationId}`;
        if (check.rows.length === 0) return new NextResponse('Not Found', { status: 404 });
        
        const conv = check.rows[0];
        
        let isAuthorized = false;
        if (conv.participant1_id === userId || conv.participant2_id === userId || conv.participant2_id === 'admin') {
            isAuthorized = true;
        } else if (conv.catalog_id) {
            const catCheck = await db.sql`SELECT user_id FROM catalogs WHERE id = ${conv.catalog_id}`;
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
        const update = await db.sql`
            UPDATE messages 
            SET is_read = true 
            WHERE conversation_id = ${conversationId} AND sender_id != ${userId}
            RETURNING id
        `;

        return NextResponse.json({ success: true, count: update.rowCount });
    } catch (error) {
        console.error('Error marking messages as read:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
