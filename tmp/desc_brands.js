const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

async function getBrandsSchema() {
    const res = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'brands'");
    console.log(res.rows.map(r => r.column_name).join(', '));
    await pool.end();
}

getBrandsSchema().catch(err => console.error(err));
