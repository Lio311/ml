import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT * FROM conversations ORDER BY updated_at DESC LIMIT 1');
    console.log("LAST CONV:", res.rows[0]);
    
    if (res.rows.length > 0) {
        const msgs = await client.query('SELECT * FROM messages WHERE conversation_id = $1', [res.rows[0].id]);
        console.log("MESSAGES FOR IT:", msgs.rows);
    }
  } catch (err) {
    console.error(err);
  } finally {
    client.release();
    pool.end();
  }
}
run();
