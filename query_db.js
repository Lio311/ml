const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function run() {
  const adminEmail = process.env.ADMIN_EMAIL;
  console.log("Admin email:", adminEmail);
  const userRes = await pool.query("SELECT id FROM users WHERE email = $1 OR role = 'admin' LIMIT 1", [adminEmail]);
  if (userRes.rows.length === 0) {
     console.log("No admin user found in db");
  } else {
     const userId = userRes.rows[0].id;
     console.log("Admin user ID in db:", userId);
     
     const res = await pool.query(`
                        SELECT COUNT(*) as total_unread
                        FROM messages m
                        JOIN conversations c ON m.conversation_id = c.id
                        WHERE (c.participant2_id = 'admin' OR c.participant2_id = $1 OR c.participant1_id = $1)
                        AND m.sender_id != $1
                        AND m.is_read = false
                    `, [userId]);
     console.log("total_unread:", res.rows[0].total_unread);
     
     const msgs = await pool.query("SELECT m.id as msg_id, m.sender_id, m.is_read, c.id as conv_id, c.participant1_id, c.participant2_id, c.order_id, c.catalog_id FROM messages m JOIN conversations c ON m.conversation_id = c.id WHERE m.is_read = false");
     console.log("All unread messages:", msgs.rows);
  }
  process.exit(0);
}
run();
