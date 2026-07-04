import pg from 'pg';
const { Client } = pg;

const client = new Client({
  connectionString: process.env.DATABASE_URL || "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
});

async function check() {
  await client.connect();
  const res = await client.query(`
    SELECT id, brand, model, active, stock, show_on_home, created_at, is_discovery_set
    FROM products
    ORDER BY created_at DESC
    LIMIT 10
  `);
  console.table(res.rows);
  await client.end();
}

check().catch(console.error);
