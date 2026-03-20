
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Adding brand_he and model_he columns...");
        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS brand_he VARCHAR(255),
            ADD COLUMN IF NOT EXISTS model_he VARCHAR(255)
        `);

        console.log("Cleaning up brand names in products (trimming)...");
        await client.query(`
            UPDATE products SET brand = TRIM(brand)
        `);

        console.log("Cleaning up brands table entries...");
        // Find brands that have duplicates due to spaces
        const duplicateBrands = await client.query(`
            SELECT TRIM(name) as trimmed_name, count(*) 
            FROM brands 
            GROUP BY TRIM(name) 
            HAVING count(*) > 1
        `);

        for (const row of duplicateBrands.rows) {
            const trimmedName = row.trimmed_name;
            console.log(`Unifying duplicate brand entries for: "${trimmedName}"`);
            
            // Get all entries for this name
            const entries = await client.query(`
                SELECT name, logo_url FROM brands WHERE TRIM(name) = $1
            `, [trimmedName]);

            // Pick the best logo_url
            const bestLogo = entries.rows.find(e => e.logo_url)?.logo_url || null;

            // Delete all entries
            await client.query(`DELETE FROM brands WHERE TRIM(name) = $1`, [trimmedName]);

            // Re-insert single trimmed entry
            await client.query(`
                INSERT INTO brands (name, logo_url) 
                VALUES ($1, $2)
                ON CONFLICT (name) DO UPDATE SET logo_url = EXCLUDED.logo_url
            `, [trimmedName, bestLogo]);
        }

        // Final check on name entries that just have trailing spaces but aren't duplicates
        await client.query(`
            UPDATE brands SET name = TRIM(name)
        `);

        console.log("Migration complete.");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
