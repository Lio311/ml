require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

async function fixBrand() {
    try {
        await pool.query("UPDATE products SET brand = 'Vivamor' WHERE brand = 'Vivamor '");
        
        // Check if Vivamor is in brands table
        const res = await pool.query("SELECT * FROM brands WHERE name = 'Vivamor'");
        if (res.rows.length === 0) {
            await pool.query("INSERT INTO brands (name) VALUES ('Vivamor')");
            console.log('Inserted Vivamor into brands table.');
        } else {
            console.log('Vivamor already in brands table.');
        }
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}

fixBrand();
