const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL,
});

async function main() {
  const res = await pool.query(`
    SELECT c.id, c.participant1_id, c.participant2_id, m.id as msg_id, m.sender_id, m.is_read
    FROM messages m
    JOIN conversations c ON m.conversation_id = c.id
    WHERE m.is_read = false
  `);
  console.log("Unread messages:", res.rows);
  pool.end();
}
main();
