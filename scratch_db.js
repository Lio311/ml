require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');

async function run() {
    try {
        const sql = neon(process.env.DATABASE_URL);
        
        const res = await sql`DELETE FROM brands WHERE name = 'Azaela' RETURNING *`;
        console.log("Deleted brand:", res);
        
    } catch(err) {
        console.error(err);
    }
}
run();
