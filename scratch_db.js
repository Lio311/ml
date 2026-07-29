const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query(`
      SELECT m.id, m.conversation_id, m.sender_id, m.is_read, c.participant1_id, c.participant2_id 
      FROM messages m
      JOIN conversations c ON m.conversation_id = c.id
      ORDER BY m.created_at DESC
      LIMIT 10
    `);
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    pool.end();
  }
}
run();
