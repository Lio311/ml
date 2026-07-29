const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
const client = new Client({
  connectionString: process.env.DATABASE_URL
});

async function run() {
  await client.connect();
  const res = await client.query(`
    SELECT c.participant1_id, c.participant2_id, m.sender_id, m.is_read, m.content, u.role
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    LEFT JOIN users u ON m.sender_id = u.id
    ORDER BY m.created_at DESC
    LIMIT 10;
  `);
  console.log("Latest messages:", res.rows);
  const unreadRes = await client.query(`
    SELECT COUNT(*) as total_unread
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE (c.participant2_id = 'admin' OR c.participant1_id = 'admin')
    AND m.is_read = false
  `);
  console.log("Unread count for admin:", unreadRes.rows[0]);
  
  await client.end();
}

run().catch(console.error);
