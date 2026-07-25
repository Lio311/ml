import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config({path: '.env.local'});
const { Pool } = pkg;
const pool = new Pool({ connectionString: process.env.POSTGRES_URL });

async function fixDB() {
    console.log("Fixing DB...");
    await pool.query(`UPDATE email_templates SET is_active = false WHERE slug IN ('new_perfumes_batch', 'new_discovery_sets')`);
    console.log("Deactivated bad templates.");
}
fixDB().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
