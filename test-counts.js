import { sql } from '@vercel/postgres';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function main() {
    try {
        console.log("Testing query...");
        // Let's assume user.id is 'user_2kZfH2z9A9s' or similar, but let's just count all unread for 'admin'
        const res = await sql`
            SELECT COUNT(*) as total_unread
            FROM messages m
            JOIN conversations c ON m.conversation_id = c.id
            WHERE c.participant2_id = 'admin'
            AND m.sender_id != 'admin'
            AND m.is_read = false
        `;
        console.log("Unread count for admin:", res.rows[0].total_unread);
    } catch (err) {
        console.error(err);
    }
}
main();
