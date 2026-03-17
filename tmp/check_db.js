const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
});

async function check() {
  try {
    const res = await pool.query("SELECT id, name, cost_price, original_size FROM products WHERE original_size = 0 OR original_size IS NULL OR original_size = 1;");
    console.log("Suspicious products:", res.rows);
    
    // Also test the problematic COGS query
    const cogsTest = await pool.query(`
                WITH expanded_items AS(
                SELECT
                    (item ->> 'quantity'):: numeric as qty,
                COALESCE((item ->> 'size'):: numeric, 2) as size,
                (SPLIT_PART(item ->> 'id', '-', 1)):: int as product_id,
                orders.catalog_id
                    FROM orders, jsonb_array_elements(items::jsonb) as item
                    WHERE status != 'cancelled'
            )
                SELECT
                    SUM(qty * (COALESCE(p.cost_price, 0) / NULLIF(p.original_size, 0)) * size) as sum_v0,
                    SUM(qty * (COALESCE(p.cost_price, 0) / NULLIF(p.original_size, 1)) * size) as sum_v1
                FROM expanded_items ei
                JOIN products p ON ei.product_id = p.id
                WHERE ei.catalog_id IS NULL
    `);
    console.log("COGS test results:", cogsTest.rows);

  } catch (e) {
    console.error("Test failed:", e);
  } finally {
    await pool.end();
  }
}

check();
