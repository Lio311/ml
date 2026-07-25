require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function run() {
    try {
        const sql = neon(process.env.DATABASE_URL);
        
        const res = await sql`SELECT column_name FROM information_schema.columns WHERE table_name = 'products'`;
        console.log("products columns:", res.map(r => r.column_name));
    } catch(err) {
        console.error(err);
    }
}
run();
