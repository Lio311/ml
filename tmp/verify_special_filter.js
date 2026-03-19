const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function verifyFilter() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL
    });
    try {
        // Simulating the logic: hasSpecialFilter = true
        const nicheBoutiqueCondition = "category NOT ILIKE '%דיזיינר%'";
        const query = `SELECT name, category FROM products WHERE active = true AND stock > 0 AND ${nicheBoutiqueCondition} LIMIT 10`;
        
        console.log("Querying for Boutique/Niche (Excluding Designer)...");
        const res = await pool.query(query);
        console.log("Found products:", res.rows.length);
        res.rows.forEach(r => {
            console.log(`- ${r.name} | Category: ${r.category}`);
            if (r.category.includes("דיזיינר")) {
                console.error("FAIL: Designer perfume found in Boutique/Niche filter!");
            }
        });

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

verifyFilter();
