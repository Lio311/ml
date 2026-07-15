const { Pool } = require('pg');
const pool = new Pool({ connectionString: "postgresql://neondb_owner:npg_G4TNRPj5eYQO@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require" });
pool.query("SELECT * FROM monthly_recommendations WHERE month = '2026-07'")
  .then(res => {
    console.log(res.rows);
    process.exit(0);
  })
  .catch(e => {
    console.error(e);
    process.exit(1);
  });
