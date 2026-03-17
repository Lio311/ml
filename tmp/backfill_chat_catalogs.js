const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
});

async function backfill() {
  try {
    console.log("Starting backfill of catalog_id in conversations...");
    
    const res = await pool.query(`
      UPDATE conversations c
      SET catalog_id = o.catalog_id
      FROM orders o
      WHERE c.order_id = o.id 
      AND c.catalog_id IS NULL 
      AND o.catalog_id IS NOT NULL
      RETURNING c.id, c.order_id, o.catalog_id
    `);
    
    console.log(`Updated ${res.rowCount} conversations.`);
    if (res.rows.length > 0) {
      console.log("Updated conversations:", res.rows);
    }

  } catch (e) {
    console.error("Backfill failed:", e);
  } finally {
    await pool.end();
  }
}

backfill();
