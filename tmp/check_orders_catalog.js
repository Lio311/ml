const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
});

async function check() {
  try {
    const res = await pool.query("SELECT id, catalog_id FROM orders WHERE id IN (79, 81)");
    console.log("Orders 79, 81:", res.rows);
  } catch (e) {
    console.error("Order check failed:", e);
  } finally {
    await pool.end();
  }
}

check();
