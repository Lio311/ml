const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    const fs = require('fs');
    const data = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));

    try {
        await client.connect();
        for (const p of data) {
            const res = await client.query(
                'UPDATE products SET seasons = $1, perfumers = $2, country = $3 WHERE name = $4',
                [p.seasons, p.perfumers, p.country, p.name]
            );
            console.log(`Updated: ${p.name} (${res.rowCount} rows)`);
        }
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}

run();
