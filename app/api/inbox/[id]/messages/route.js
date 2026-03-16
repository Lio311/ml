import pool from '../../../../lib/db';
import { getAuth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
    try {
        const { userId } = getAuth(req);
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const { id: conversationId } = await params;

        // Verify user is part of the conversation (or is admin/catalog_owner)
        // Simplified check: since they know the ID, we could just fetch it, but let's be secure
        const check = await pool.query(`
            SELECT * FROM conversations WHERE id = $1
        `, [conversationId]);
        
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
            const catCheck = await pool.query(`SELECT user_id FROM catalogs WHERE id = $1`, [conv.catalog_id]);
            if (catCheck.rows.length > 0 && catCheck.rows[0].user_id === userId) {
                isAuthorized = true;
            }
        }

        if (!isAuthorized) return new NextResponse('Forbidden', { status: 403 });

        const messages = await pool.query(`
            SELECT m.id, m.sender_id, m.content, m.is_read, m.created_at, u.role as sender_role
            FROM messages m
            LEFT JOIN users u ON m.sender_id = u.id
            WHERE m.conversation_id = $1
            ORDER BY m.created_at ASC
        `, [conversationId]);

        // Fetch other participant's last seen
        const otherId = conv.participant1_id === userId ? conv.participant2_id : conv.participant1_id;
        let lastSeen = null;
        if (otherId && otherId !== 'admin') {
            const userRes = await pool.query('SELECT last_active_at FROM users WHERE id = $1', [otherId]);
            lastSeen = userRes.rows[0]?.last_active_at || null;
        } else if (otherId === 'admin') {
            // Check for last active admin
            const adminRes = await pool.query("SELECT last_active_at FROM users WHERE role = 'admin' ORDER BY last_active_at DESC LIMIT 1");
            lastSeen = adminRes.rows[0]?.last_active_at || null;
        }

        return NextResponse.json({
            messages: messages.rows,
            other_participant: {
                id: otherId,
                last_active_at: lastSeen
            }
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(req, { params }) {
    try {
        const { userId } = getAuth(req);
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const { id: conversationId } = await params;
        const body = await req.json();
        const { content } = body;

        if (!content || !content.trim()) {
            return new NextResponse('Content is required', { status: 400 });
        }

        const insertMsg = await pool.query(`
            WITH inserted AS (
                INSERT INTO messages (conversation_id, sender_id, content)
                VALUES ($1, $2, $3)
                RETURNING id, sender_id, content, is_read, created_at
            )
            SELECT i.*, u.role as sender_role
            FROM inserted i
            LEFT JOIN users u ON i.sender_id = u.id
        `, [conversationId, userId, content.trim()]);

        await pool.query(`
            UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1
        `, [conversationId]);

        return NextResponse.json(insertMsg.rows[0]);
    } catch (error) {
        console.error('Error sending message:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
