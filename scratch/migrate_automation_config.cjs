const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

const defaults = [
    { slug: 'cart_recovery', config: { delay_hours: 3, cooldown_days: 7, discount_percent: 5, coupon_validity_hours: 24 } },
    { slug: 'nurture_10_days', config: { delay_days: 10 } },
    { slug: 'nurture_25_days', config: { delay_days: 25 } },
    { slug: 'review_request', config: { delay_days: 7 } },
    { slug: 'educational_email', config: { delay_days: 3 } },
    { slug: 'recommendations_send', config: { delay_days: 30 } },
];

async function migrate() {
    console.log("🚀 Creating automation_config table...");
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        await client.query(`
            CREATE TABLE IF NOT EXISTS automation_config (
                slug TEXT PRIMARY KEY,
                config JSONB DEFAULT '{}',
                updated_at TIMESTAMPTZ DEFAULT NOW()
            );
        `);
        console.log("✅ Table created.");

        for (const d of defaults) {
            await client.query(`
                INSERT INTO automation_config (slug, config)
                VALUES ($1, $2)
                ON CONFLICT (slug) DO NOTHING
            `, [d.slug, JSON.stringify(d.config)]);
            console.log(`  ➡️ ${d.slug}: ${JSON.stringify(d.config)}`);
        }

        await client.query('COMMIT');
        console.log("🎉 Migration complete!");
    } catch (err) {
        await client.query('ROLLBACK');
        console.error("❌ Migration failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
