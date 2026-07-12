const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function run() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL
    });
    await client.connect();
    const res = await client.query('SELECT id, brand, model, name_he FROM products');
    const products = res.rows.map(r => ({
        id: r.id,
        name: `${r.brand} - ${r.model}`,
        name_he: r.name_he
    }));
    require('fs').writeFileSync('perfumes.json', JSON.stringify(products, null, 2));
    await client.end();
}
run();
