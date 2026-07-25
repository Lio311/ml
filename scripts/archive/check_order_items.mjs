import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });
import pg from 'pg';
const { Pool } = pg;

async function main() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  const client = await pool.connect();
  try {
    const res = await client.query(`
        SELECT * FROM order_items WHERE order_id = 237
    `);
    console.log(res.rows);
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    process.exit(0);
  }
}

main();
