const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
});

async function check() {
  try {
    const schemaRes = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'items';");
    console.log("Orders items column schema:", schemaRes.rows);
    
    // Test with explicit casting if it's text
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
                    SUM(qty * (COALESCE(p.cost_price, 0) / NULLIF(p.original_size, 0)) * size) as sum
                FROM expanded_items ei
                JOIN products p ON ei.product_id = p.id
                WHERE ei.catalog_id IS NULL
    `);
    console.log("COGS test with casting results:", cogsTest.rows);

  } catch (e) {
    console.error("Test failed:", e);
  } finally {
    await pool.end();
  }
}

check();
