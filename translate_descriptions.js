const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL || "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function translateText(text) {
    if (!text) return text;
    try {
        const response = await fetch('https://translate.googleapis.com/translate_a/single?client=gtx&sl=he&tl=en&dt=t&q=' + encodeURIComponent(text));
        const data = await response.json();
        return data[0].map(item => item[0]).join('');
    } catch (e) {
        console.error("Translation failed:", e);
        return text;
    }
}

async function main() {
    const client = await pool.connect();
    try {
        console.log("Fetching products to translate...");
        // Select products where description_en is either identical to description or empty/null
        const res = await client.query(`
            SELECT id, name, description, description_en 
            FROM products 
            WHERE description IS NOT NULL 
              AND description != ''
              AND (description_en IS NULL OR description_en = '' OR description_en = description)
        `);

        const products = res.rows;
        console.log(`Found ${products.length} products to translate.`);

        for (const product of products) {
            console.log(`Translating ID ${product.id}: ${product.name}...`);
            const translatedDescription = await translateText(product.description);
            
            await client.query(`
                UPDATE products 
                SET description_en = $1 
                WHERE id = $2
            `, [translatedDescription, product.id]);
            
            // Be nice to the API
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log("Translation complete!");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

main();
