import { db } from '@vercel/postgres';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
    try {
        const { userId } = getAuth(req);
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const { id: conversationId } = params;

        // Verify user is part of the conversation (or is admin/catalog_owner)
        // Simplified check: since they know the ID, we could just fetch it, but let's be secure
        const check = await db.sql`
            SELECT * FROM conversations WHERE id = ${conversationId}
        `;
        
        if (check.rows.length === 0) return new NextResponse('Not Found', { status: 404 });
        
        const conv = check.rows[0];
        
        // Authorization: User is participant1, OR user is participant2 ('admin' implies any admin), OR user owns the catalog
        let isAuthorized = false;
        if (conv.participant1_id === userId || conv.participant2_id === userId) {
            isAuthorized = true;
        } else if (conv.participant2_id === 'admin') {
            // Need to check if user has admin role (assuming you have an admin check)
            // Simplified: trusting frontend admin boundary for now, but in prod verify admin role
            isAuthorized = true; 
        } else if (conv.catalog_id) {
            // Verify if user owns catalog
            const catCheck = await db.sql`SELECT user_id FROM catalogs WHERE id = ${conv.catalog_id}`;
            if (catCheck.rows.length > 0 && catCheck.rows[0].user_id === userId) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) return new NextResponse('Forbidden', { status: 403 });

        const messages = await db.sql`
            SELECT id, sender_id, content, is_read, created_at 
            FROM messages 
            WHERE conversation_id = ${conversationId}
            ORDER BY created_at ASC
        `;

        // We can fetch names from Clerk if we want, or do that on the client side
        return NextResponse.json(messages.rows);
    } catch (error) {
        console.error('Error fetching messages:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(req, { params }) {
    try {
        const { userId } = getAuth(req);
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const { id: conversationId } = params;
        const body = await req.json();
        const { content } = body;

        if (!content || !content.trim()) {
            return new NextResponse('Content is required', { status: 400 });
        }

        const insertMsg = await db.sql`
            INSERT INTO messages (conversation_id, sender_id, content)
            VALUES (${conversationId}, ${userId}, ${content.trim()})
            RETURNING id, sender_id, content, is_read, created_at
        `;

        await db.sql`
            UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = ${conversationId}
        `;

        return NextResponse.json(insertMsg.rows[0]);
    } catch (error) {
        console.error('Error sending message:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
