require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fix() {
  try {
    await pool.query('UPDATE users SET address = $1, phone = $2 WHERE email = $3', [
      JSON.stringify({city: 'אכסאל', street: 'לעדן', houseNumber: '5', apartment: '0'}), 
      '0526881303', 
      '5555hade@gmail.com'
    ]);
    console.log('Updated user successfully');
  } catch (err) {
    console.error(err);
  } finally {
    process.exit(0);
  }
}
fix();
