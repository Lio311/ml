const { neon } = require('@neondatabase/serverless');
require('dotenv').config({path: '.env.local'});
const sql = neon(process.env.DATABASE_URL);

async function run() {
    try {
        console.log("Adding 'preferences' column to 'users' table...");
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS preferences jsonb DEFAULT '{}'::jsonb;`;
        console.log("Column added successfully!");
    } catch (e) {
        console.error("Error migrating:", e);
    }
}
run();
