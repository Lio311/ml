const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function listProducts() {
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT brand, model FROM products ORDER BY brand, model');

        let content = "# All Products in Database\n\n";
        res.rows.forEach(row => {
            content += `- **${row.brand}** ${row.model}\n`;
        });

        const outputPath = "C:\\Users\\Lior\\.gemini\\antigravity\\brain\\8b8ea07a-1f8d-43af-ba8f-533d0dedf598\\products_list_db.md";
        fs.writeFileSync(outputPath, content);
        console.log(`Successfully wrote ${res.rows.length} products to ${outputPath}`);

        client.release();
    } catch (err) {
        console.error('Error fetching products:', err);
    } finally {
        pool.end();
    }
}

listProducts();
