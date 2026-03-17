const { Pool } = require('pg');
const pool = new Pool({
  connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require"
});

async function check() {
  try {
    const convCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'conversations'");
    console.log("Conversations columns:", convCols.rows);
    
    const msgCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'messages'");
    console.log("Messages columns:", msgCols.rows);

    const sampleConvs = await pool.query("SELECT * FROM conversations LIMIT 5");
    console.log("Sample conversations:", sampleConvs.rows);

  } catch (e) {
    console.error("Schema check failed:", e);
  } finally {
    await pool.end();
  }
}

check();
