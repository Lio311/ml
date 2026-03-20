const pool = require('./app/lib/db');

async function checkBrands() {
  try {
    const res = await pool.query('SELECT name, logo_url FROM brands WHERE logo_url IS NOT NULL LIMIT 10');
    console.log('Brands found:', res.rows.length);
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (e) {
    console.error('Error fetching brands:', e);
  } finally {
    process.exit();
  }
}

checkBrands();
