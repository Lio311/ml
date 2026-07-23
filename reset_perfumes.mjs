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
    // Reset the perfumes
    await client.query(`
        UPDATE products 
        SET perfume_email_sent = false 
        WHERE id IN (259, 260, 299, 300)
    `);
    
    // Clear the rate limit so we can test again
    await client.query(`
        DELETE FROM site_settings 
        WHERE key = 'last_marketing_email_date'
    `);
    
    console.log('Successfully reset the 4 new perfumes and cleared the rate limit.');
  } catch (e) {
    console.error(e);
  } finally {
    client.release();
    process.exit(0);
  }
}

main();
