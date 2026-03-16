const pool = require('../app/lib/db').default; // Using the db pool directly won't work easily from a raw node script since it uses ES6 import and next/server etc. Let's just use pg directly

const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pgPool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
    console.log("Adding order_id to conversations...");
    const client = await pgPool.connect();
    try {
        await client.query(`ALTER TABLE conversations ADD COLUMN order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE;`);
        console.log("Success");
    } catch(e) {
        if(e.code === '42701') console.log("Column already exists");
        else console.error(e);
    } finally {
        client.release();
        await pgPool.end();
        process.exit();
    }
}

run();
