import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT id, brand, model, active, stock, is_discovery_set, category, category_en
    FROM products
    WHERE brand ILIKE '%Kintsugi%'
  `);
  console.table(res.rows);
  await client.end();
}

check().catch(console.error);
