const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkOrders() {
  const client = await pool.connect();
  try {
    const res = await client.query('SELECT id, total_amount, delivery_method, items FROM orders WHERE id IN (111, 112)');
    console.log(JSON.stringify(res.rows, null, 2));
  } finally {
    client.release();
    pool.end();
  }
}

checkOrders();
