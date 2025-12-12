const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await client.connect();
        console.log("Connected to DB.");

        // 1. Add Columns
        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS brand TEXT,
            ADD COLUMN IF NOT EXISTS model TEXT;
        `);
        console.log("Schema updated.");

        // 2. Fetch and Update
        const res = await client.query('SELECT id, name, category FROM products');
        const updates = [];

        for (const p of res.rows) {
            // Heuristic: Brand is Category. Model is Name minus Brand.
            let brand = p.category ? p.category.trim() : 'Unknown';
            let model = p.name;

            if (brand !== 'Unknown' && p.name.toLowerCase().startsWith(brand.toLowerCase())) {
                model = p.name.substring(brand.length).trim();
                // Remove leading " - " or similar if exists
                model = model.replace(/^[-: ]+/, '');
            }

            updates.push(client.query(`
                UPDATE products 
                SET brand = $1, model = $2 
                WHERE id = $3
            `, [brand, model, p.id]));
        }

        await Promise.all(updates);
        console.log(`Updated ${updates.length} products with Brand/Model.`);

        // 3. Generate List for Review
        const finalRes = await client.query('SELECT id, brand, model, price_10ml FROM products ORDER BY brand, model');
        const lines = finalRes.rows.map(p =>
            `[${p.id}] M: ${p.brand} | D: ${p.model} | P(10ml): ${p.price_10ml}`
        );

        fs.writeFileSync('products_review_list.txt', lines.join('\n'));
        console.log("Created products_review_list.txt");

    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}

run();
