const { Pool } = require('pg');

const DATABASE_URL = "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        console.log("Checking current state...");
        const selectRes = await pool.query("SELECT id, name, perfumers FROM products WHERE perfumers ILIKE '%Amelie Bourgeois%' OR perfumers ILIKE '%Amélie Bourgeois%'");
        console.log(`Found ${selectRes.rows.length} products.`);

        let updatedCount = 0;
        for (const row of selectRes.rows) {
            const oldPerfumers = row.perfumers;
            // Unify: replace 'Amelie Bourgeois' (no accent) with 'Amélie Bourgeois' (accent)
            // But be careful with regex to match exactly 'Amelie Bourgeois' as a whole word or part of comma list
            const newPerfumers = oldPerfumers.replace(/Amelie Bourgeois/g, "Amélie Bourgeois");
            
            if (newPerfumers !== oldPerfumers) {
                await pool.query("UPDATE products SET perfumers = $1 WHERE id = $2", [newPerfumers, row.id]);
                console.log(`Updated product ${row.id}: ${row.name}`);
                updatedCount++;
            }
        }
        console.log(`Successfully updated ${updatedCount} products.`);

    } catch (err) {
        console.error("Error during update:", err);
    } finally {
        await pool.end();
    }
}

run();
