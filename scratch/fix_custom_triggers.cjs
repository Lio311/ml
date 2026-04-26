const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixTriggers() {
    console.log("🛠️ Fixing trigger types in DB...");
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT id, name, nodes FROM workflows');
        for (const row of res.rows) {
            let updated = false;
            const nodes = Array.isArray(row.nodes) ? row.nodes : [];
            for (const node of nodes) {
                if (node.type === 'trigger' && node.data && node.data.triggerType === 'custom') {
                    console.log(`Fixing ${row.name}: replacing custom with ${node.data.customTrigger}`);
                    node.data.triggerType = node.data.customTrigger;
                    delete node.data.customTrigger;
                    updated = true;
                }
            }
            if (updated) {
                await client.query('UPDATE workflows SET nodes = $1 WHERE id = $2', [JSON.stringify(nodes), row.id]);
            }
        }
        console.log("🎉 DB triggers fixed!");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

fixTriggers();
