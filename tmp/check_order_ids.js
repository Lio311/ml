const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
});

async function check() {
  try {
    const res = await pool.query(`
      SELECT id, items FROM orders 
      WHERE status != 'cancelled' AND catalog_id IS NULL;
    `);
    
    console.log("Analyzing", res.rows.length, "orders...");
    const problematic = [];
    
    res.rows.forEach(order => {
      const items = order.items; // It's already parsed if it's jsonb in the driver
      if (!Array.isArray(items)) {
          console.log("Order", order.id, "has non-array items:", typeof items);
          return;
      }
      items.forEach(item => {
        const idStr = item.id ? String(item.id) : null;
        if (!idStr) {
          problematic.push({ orderId: order.id, error: "Missing ID", item });
          return;
        }
        const firstPart = idStr.split('-')[0];
        const asInt = parseInt(firstPart);
        if (isNaN(asInt)) {
          problematic.push({ orderId: order.id, error: "Not an integer", idStr, firstPart });
        }
      });
    });
    
    console.log("Problematic items found:", problematic.length);
    if (problematic.length > 0) {
      console.log(problematic.slice(0, 10));
    }

  } catch (e) {
    console.error("Analysis failed:", e);
  } finally {
    await pool.end();
  }
}

check();
