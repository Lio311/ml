require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function testRecs() {
    const client = await pool.connect();
    try {
        // Pick a product ID to test (e.g., Goti 180 or just ID 1)
        const id = 180;
        console.log(`Testing recommendations for Product ID: ${id}`);

        // 1. Get Product
        const res = await client.query(`SELECT * FROM products WHERE id = $1`, [id]);
        const product = res.rows[0];
        if (!product) {
            console.error("Product not found");
            return;
        }
        console.log(`Product: ${product.name}, Category: ${product.category}`);
        console.log(`Notes: T=[${product.top_notes}] M=[${product.middle_notes}] B=[${product.base_notes}]`);

        // 2. Fetch All Active
        const allRes = await client.query('SELECT id, name, active FROM products WHERE id != $1 AND active = true', [id]);
        console.log(`Active products found (excluding current): ${allRes.rowCount}`);

        // 3. Mimic Logic
        const allProductsRes = await client.query('SELECT id, name, brand, image_url, top_notes, middle_notes, base_notes, category FROM products WHERE id != $1 AND active = true', [id]);
        const allProducts = allProductsRes.rows;

        const currentNotes = new Set([
            ...(product.top_notes || '').split(',').map(n => n.trim()).filter(Boolean),
            ...(product.middle_notes || '').split(',').map(n => n.trim()).filter(Boolean),
            ...(product.base_notes || '').split(',').map(n => n.trim()).filter(Boolean)
        ]);

        console.log("Current Notes Set size:", currentNotes.size);

        const related = allProducts.map(p => {
            const pNotes = new Set([
                ...(p.top_notes || '').split(',').map(n => n.trim()).filter(Boolean),
                ...(p.middle_notes || '').split(',').map(n => n.trim()).filter(Boolean),
                ...(p.base_notes || '').split(',').map(n => n.trim()).filter(Boolean)
            ]);

            // Intersection count
            let intersection = 0;
            pNotes.forEach(note => {
                if (currentNotes.has(note)) intersection++;
            });

            // Jaccard Index = (Intersection) / (Union)
            const union = new Set([...currentNotes, ...pNotes]).size;
            const score = union === 0 ? 0 : intersection / union;

            // Boost if same category
            const categoryBonus = (p.category && product.category && p.category.includes(product.category)) ? 0.1 : 0;

            return { id: p.id, name: p.name, similarity: score + categoryBonus, score, categoryBonus };
        })
            .sort((a, b) => b.similarity - a.similarity)
            .slice(0, 4);

        console.table(related);

    } catch (e) {
        console.error("Error in script:", e);
    } finally {
        client.release();
        await pool.end();
    }
}

testRecs();
