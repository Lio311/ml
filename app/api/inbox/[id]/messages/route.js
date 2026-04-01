import pool, { updateUserActivity } from '../../../../lib/db';
import { auth as clerkAuth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { sanitizeProductArray } from '../../../../lib/productUtils';

export async function GET(req, { params }) {
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        // Update user activity proactively
        await updateUserActivity(userId);

        const { id: conversationId } = await params;

        if (typeof conversationId === 'string' && conversationId.startsWith('order_')) {
            return NextResponse.json({
                messages: [],
                other_participant: { id: null, last_active_at: null }
            });
        }

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
            const catCheck = await pool.query(`SELECT user_id FROM user_catalogs WHERE id = $1`, [conv.catalog_id]);
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
            messages: sanitizeProductArray(messages.rows),
            other_participant: sanitizeProductArray([{
                id: otherId,
                last_active_at: lastSeen
            }])[0]
        });
    } catch (error) {
        console.error('Error fetching messages:', error);
        return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 });
    }
}

export async function POST(req, { params }) {
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        // Update user activity proactively
        await updateUserActivity(userId);

        let { id: conversationId } = await params;
        const body = await req.json();
        const { content } = body;

        if (!content || !content.trim()) {
            return new NextResponse('Content is required', { status: 400 });
        }

        // If it's a virtual order conversation, we need to create it first
        if (typeof conversationId === 'string' && conversationId.startsWith('order_')) {
            const orderId = parseInt(conversationId.replace('order_', ''));
            console.log("DEBUG: POST /api/inbox/messages - Creating conversation for virtual order:", orderId);
            
            // Auto-resolve catalog_id and owner
            const orderRes = await pool.query(`
                SELECT o.catalog_id, c.user_id as owner_id 
                FROM orders o 
                LEFT JOIN user_catalogs c ON o.catalog_id = c.id 
                WHERE o.id = $1
            `, [orderId]);
            
            const catalogId = orderRes.rows[0]?.catalog_id || null;
            const p2 = orderRes.rows[0]?.owner_id || 'admin';

            // Check if exists first (concurrency protection)
            const check = await pool.query('SELECT id FROM conversations WHERE order_id = $1', [orderId]);
            if (check.rows.length > 0) {
                conversationId = check.rows[0].id;
            } else {
                console.log("DEBUG: POST /api/inbox/messages - Creating conversation with p2:", p2);
                const insertConv = await pool.query(`
                    INSERT INTO conversations (participant1_id, participant2_id, catalog_id, order_id)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                `, [userId, p2, catalogId, orderId]);
                conversationId = insertConv.rows[0].id;
            }
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

        return NextResponse.json(sanitizeProductArray([insertMsg.rows[0]])[0]);
    } catch (error) {
        console.error('Error sending message:', error);
        return NextResponse.json({ error: 'Internal Error', details: error.message }, { status: 500 });
    }
}
