import dotenv from 'dotenv';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: resolve(__dirname, './.env.local') });

import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS pending_order_emails (
          order_id INT PRIMARY KEY,
          initial_status VARCHAR(50) NOT NULL,
          process_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Table pending_order_emails created successfully.');
  } catch (error) {
    console.error('Error creating table:', error);
  } finally {
    client.release();
    pool.end();
  }
}

main();
