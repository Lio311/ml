import pool from '../../../../lib/db';
import { getAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const { userId } = getAuth(req);
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const { searchParams } = new URL(req.url);
        const catalogId = searchParams.get('catalog_id');
        const asAdmin = searchParams.get('as_admin') === 'true';

        // Admins can see conversations where participant2_id = 'admin'
        // Catalog owners can see conversations where catalog_id = catalogId
        // Buyers can see conversations where participant1_id = userId

        let query;

        if (asAdmin) {
            // Check if user is admin (you can add your admin validation logic here)
            query = await pool.query(`
                SELECT c.*, 
                       (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                       (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
                       (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND sender_id != 'admin' AND is_read = false) as unread_count
                FROM conversations c 
                WHERE c.participant2_id = 'admin'
                ORDER BY c.updated_at DESC
            `);
        } else if (catalogId) {
            query = await pool.query(`
                SELECT c.*, 
                       (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                       (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
                       (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND sender_id != $1 AND is_read = false) as unread_count
                FROM conversations c 
                WHERE c.catalog_id = $2
                ORDER BY c.updated_at DESC
            `, [userId, catalogId]);
        } else {
            // Buyer mode
            query = await pool.query(`
                SELECT c.*, 
                       (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                       (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
                       (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND sender_id != $1 AND is_read = false) as unread_count
                FROM conversations c 
                WHERE c.participant1_id = $2
                ORDER BY c.updated_at DESC
            `, [userId, userId]);
        }

        return NextResponse.json(query.rows);
    } catch (error) {
        console.error('Error fetching inbox:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { userId } = getAuth(req);
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const body = await req.json();
        const { participant2_id, catalog_id, content } = body;

        let conversationId;

        // Check if conversation already exists
        let checkQuery;
        if (catalog_id) {
            checkQuery = await pool.query(`
                SELECT id FROM conversations 
                WHERE participant1_id = $1 AND catalog_id = $2
                LIMIT 1
            `, [userId, catalog_id]);
        } else {
            checkQuery = await pool.query(`
                SELECT id FROM conversations 
                WHERE participant1_id = $1 AND participant2_id = $2 AND catalog_id IS NULL
                LIMIT 1
            `, [userId, participant2_id || 'admin']);
        }

        if (checkQuery.rows.length > 0) {
            conversationId = checkQuery.rows[0].id;
        } else {
            // Create new conversation
            const insertConv = await pool.query(`
                INSERT INTO conversations (participant1_id, participant2_id, catalog_id)
                VALUES ($1, $2, $3)
                RETURNING id
            `, [userId, participant2_id || 'admin', catalog_id || null]);
            conversationId = insertConv.rows[0].id;
        }

        // Insert message
        const insertMsg = await pool.query(`
            INSERT INTO messages (conversation_id, sender_id, content)
            VALUES ($1, $2, $3)
            RETURNING *
        `, [conversationId, userId, content]);

        // Update conversation timestamp
        await pool.query(`
            UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1
        `, [conversationId]);

        return NextResponse.json(insertMsg.rows[0]);
    } catch (error) {
        console.error('Error sending message:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
