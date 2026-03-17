import pool, { updateUserActivity } from '../../lib/db';
import { auth as clerkAuth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        console.log("DEBUG: GET /api/inbox - Starting request");
        const authData = await clerkAuth();
        const userId = authData?.userId;
        console.log("DEBUG: GET /api/inbox - Authenticated userId:", userId);
        
        if (!userId) {
            console.log("DEBUG: GET /api/inbox - Unauthorized");
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // Update user activity proactively
        console.log("DEBUG: GET /api/inbox - Updating activity for:", userId);
        await updateUserActivity(userId);
        console.log("DEBUG: GET /api/inbox - Activity updated");

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
                       (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND sender_id != $1 AND is_read = false) as unread_count
                FROM conversations c 
                WHERE c.participant2_id = 'admin' AND c.catalog_id IS NULL
                ORDER BY c.updated_at DESC
            `, [userId]);
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
            // Buyer mode: Get existing conversations AND orders that don't have conversations yet
            query = await pool.query(`
                WITH user_orders AS (
                    SELECT id as order_id, created_at, catalog_id
                    FROM orders 
                    WHERE customer_details->>'clerk_id' = $1
                ),
                existing_convs AS (
                    SELECT * FROM conversations WHERE participant1_id = $2
                )
                SELECT 
                    COALESCE(c.id::text, 'order_' || o.order_id::text) as id,
                    $3::text as participant1_id,
                    COALESCE(c.participant2_id, CASE WHEN COALESCE(c.catalog_id, o.catalog_id) IS NOT NULL THEN NULL ELSE 'admin' END)::text as participant2_id,
                    COALESCE(c.catalog_id, o.catalog_id) as catalog_id,
                    o.order_id,
                    COALESCE(c.updated_at, o.created_at) as updated_at,
                    (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                    (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
                    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND sender_id != $4 AND is_read = false) as unread_count
                FROM user_orders o
                LEFT JOIN existing_convs c ON o.order_id = c.order_id
                
                UNION ALL
                
                SELECT 
                    c.id::text,
                    c.participant1_id,
                    c.participant2_id,
                    c.catalog_id,
                    c.order_id,
                    c.updated_at,
                    (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message,
                    (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY created_at DESC LIMIT 1) as last_message_time,
                    (SELECT COUNT(*) FROM messages m WHERE m.conversation_id = c.id AND sender_id != $5 AND is_read = false) as unread_count
                FROM existing_convs c
                WHERE c.order_id IS NULL
                
                ORDER BY updated_at DESC
            `, [userId, userId, userId, userId, userId]);
        }

        let convs = query.rows;

        // Fetch user names for admin/seller view
        if (asAdmin || catalogId) {
            try {
                const clerk = await clerkClient();
                const userIds = [...new Set(convs.map(c => c.participant1_id))];
                
                if (userIds.length > 0) {
                    const dbUsers = await pool.query('SELECT id, last_active_at FROM users WHERE id = ANY($1)', [userIds]);
                    const dbUserMap = {};
                    dbUsers.rows.forEach(u => { dbUserMap[u.id] = u.last_active_at; });

                    const userList = await clerk.users.getUserList({ userId: userIds, limit: 100 });
                    const userMap = {};
                    userList.data.forEach(u => {
                        const fullName = `${u.firstName || ''} ${u.lastName || ''}`.trim();
                        userMap[u.id] = {
                            name: fullName || u.emailAddresses[0]?.emailAddress || "לקוח",
                            image: u.imageUrl || null,
                            last_active_at: dbUserMap[u.id] || null
                        };
                    });
                    
                    convs = convs.map(c => ({
                        ...c,
                        participant1_name: userMap[c.participant1_id]?.name || "לקוח (ID: " + c.participant1_id.slice(-4) + ")",
                        participant1_image: userMap[c.participant1_id]?.image || null,
                        participant1_last_active: userMap[c.participant1_id]?.last_active_at || null
                    }));
                }
            } catch (err) {
                console.error("Error fetching clerk users for inbox", err);
            }
        }

        return NextResponse.json(convs);
    } catch (error) {
        console.error('ERROR: GET /api/inbox failed:', error);
        return NextResponse.json({ 
            error: 'Internal Error', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        console.log("DEBUG: POST /api/inbox - Starting request");
        const authData = await clerkAuth();
        const userId = authData?.userId;
        console.log("DEBUG: POST /api/inbox - Authenticated userId:", userId);
        
        if (!userId) {
            console.log("DEBUG: POST /api/inbox - Unauthorized");
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        let { conversation_id, participant2_id, catalog_id, order_id, content } = body;

        console.log("DEBUG: POST /api/inbox - Body received:", { conversation_id, participant2_id, catalog_id, order_id, content: content?.slice(0, 10) + '...' });

        if (!content || !content.trim()) {
            console.log("DEBUG: POST /api/inbox - Missing content");
            return new NextResponse('Content is required', { status: 400 });
        }

        // Update user activity/JIT sync
        await updateUserActivity(userId);

        let conversationId = conversation_id;

        // If conversation_id is a string like 'order_123', it means we're starting a chat from an order
        if (typeof conversationId === 'string' && conversationId.startsWith('order_')) {
            const extractedOrderId = parseInt(conversationId.replace('order_', ''));
            if (!isNaN(extractedOrderId)) {
                order_id = extractedOrderId;
                conversationId = null;
                console.log("DEBUG: POST /api/inbox - Converted order_X ID into order_id:", order_id);
            }
        }

        // Auto-resolve catalog_id from order_id if not provided
        if (order_id && !catalog_id) {
            try {
                const orderRes = await pool.query('SELECT catalog_id FROM orders WHERE id = $1', [order_id]);
                if (orderRes.rows.length > 0) {
                    catalog_id = orderRes.rows[0].catalog_id;
                }
            } catch (err) {
                console.error("Error auto-resolving catalog_id from order:", err);
            }
        }

        // If no conversationId provided, try to find or create
        if (!conversationId) {
            // Check if conversation already exists
            let checkQuery;
            if (order_id) {
                checkQuery = await pool.query(`
                    SELECT id FROM conversations 
                    WHERE order_id = $1
                    LIMIT 1
                `, [order_id]);
            } else if (catalog_id) {
                checkQuery = await pool.query(`
                    SELECT id FROM conversations 
                    WHERE ((participant1_id = $1 AND catalog_id = $2) OR (participant2_id = $1 AND catalog_id = $2)) AND order_id IS NULL
                    LIMIT 1
                `, [userId, catalog_id]);
            } else if (participant2_id) {
                checkQuery = await pool.query(`
                    SELECT id FROM conversations 
                    WHERE (participant1_id = $1 AND participant2_id = $2) OR (participant1_id = $2 AND participant2_id = $1)
                    LIMIT 1
                `, [userId, participant2_id]);
            }

            if (checkQuery?.rows && checkQuery.rows.length > 0) {
                conversationId = checkQuery.rows[0].id;
            } else {
                // Determine participant2_id
                let p2 = participant2_id || 'admin';
                if (catalog_id) {
                    try {
                        const catRes = await pool.query('SELECT user_id FROM user_catalogs WHERE id = $1', [catalog_id]);
                        if (catRes.rows.length > 0) {
                            p2 = catRes.rows[0].user_id;
                        }
                    } catch (err) {
                        console.error("DEBUG: POST /api/inbox - Error resolving catalog owner:", err);
                    }
                }

                // Create new conversation
                console.log("DEBUG: POST /api/inbox - Creating conversation with p2:", p2);
                const insertConv = await pool.query(`
                    INSERT INTO conversations (participant1_id, participant2_id, catalog_id, order_id)
                    VALUES ($1, $2, $3, $4)
                    RETURNING id
                `, [userId, p2, catalog_id || null, order_id || null]);
                conversationId = insertConv.rows[0].id;
            }
        }

        // Insert message with role
        const insertMsg = await pool.query(`
            WITH inserted AS (
                INSERT INTO messages (conversation_id, sender_id, content)
                VALUES ($1, $2, $3)
                RETURNING *
            )
            SELECT i.*, u.role as sender_role
            FROM inserted i
            LEFT JOIN users u ON i.sender_id = u.id
        `, [conversationId, userId, content]);

        // Update conversation timestamp
        await pool.query(`
            UPDATE conversations SET updated_at = CURRENT_TIMESTAMP WHERE id = $1
        `, [conversationId]);

        return NextResponse.json(insertMsg.rows[0]);
    } catch (error) {
        console.error('ERROR: POST /api/inbox failed:', error);
        return NextResponse.json({ 
            error: 'Internal Error', 
            details: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        }, { status: 500 });
    }
}
