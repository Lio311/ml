const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require' });
async function main() {
    try {
        const t = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'coupons'");
        console.log('Columns:', t.rows.map(r => r.column_name));
    } finally {
        pool.end();
    }
}
main();
