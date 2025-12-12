const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const PRODUCTS_PATH = path.join(__dirname, '../../scripts/products.json');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
});

async function seed() {
    try {
        if (!fs.existsSync(PRODUCTS_PATH)) {
            console.error("Products file not found at:", PRODUCTS_PATH);
            return;
        }

        const products = JSON.parse(fs.readFileSync(PRODUCTS_PATH, 'utf8'));
        console.log(`Loaded ${products.length} products locally.`);

        await client.connect();
        console.log("Connected to database.");

        // Optional: Clear existing products? 
        // Let's truncate to ensure clean slate (safe for initial dev).
        await client.query('TRUNCATE TABLE products RESTART IDENTITY;');
        console.log("Cleared existing products.");

        let successCount = 0;

        for (const p of products) {
            const query = `
        INSERT INTO products (name, category, price_10ml, price_5ml, price_2ml, has_image, is_limited)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;
            const values = [
                p.name,
                p.category,
                p.price_10ml,
                p.price_5ml,
                p.price_2ml,
                p.has_image,
                p.is_limited
            ];

            await client.query(query, values);
            successCount++;
        }

        console.log(`Successfully seeded ${successCount} products.`);

    } catch (err) {
        console.error("Error seeding database:", err);
    } finally {
        await client.end();
    }
}

seed();
