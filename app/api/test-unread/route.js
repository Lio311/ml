import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { auth as clerkAuth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        
        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT c.participant1_id, c.participant2_id, m.sender_id, m.is_read, m.content
                FROM messages m
                JOIN conversations c ON m.conversation_id = c.id
                ORDER BY m.created_at DESC
                LIMIT 5;
            `);
            
            const unreadRes = await client.query(`
                SELECT COUNT(*) as total_unread
                FROM messages m
                JOIN conversations c ON m.conversation_id = c.id
                WHERE (c.participant2_id = 'admin' OR c.participant1_id = 'admin')
                AND m.is_read = false
            `);
            
            return NextResponse.json({
                userId,
                unreadForAdmin: unreadRes.rows[0],
                recentMessages: res.rows
            });
        } finally {
            client.release();
        }
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
