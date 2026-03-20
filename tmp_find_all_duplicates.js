const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function findAllDuplicates() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        const res = await pool.query("SELECT name FROM brands");
        const brands = res.rows.map(r => r.name);
        
        const normalize = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        
        const normalizedMap = {};
        const duplicates = [];

        brands.forEach(name => {
            const norm = normalize(name);
            if (normalizedMap[norm]) {
                duplicates.push([normalizedMap[norm], name]);
            } else {
                normalizedMap[norm] = name;
            }
        });

        console.log('Duplicate brand names (ignoring accents and case):');
        console.log(duplicates);

    } catch (err) {
        console.error('Database Error:', err);
    } finally {
        await pool.end();
    }
}

findAllDuplicates();
