const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });
const pg = require('pg');

const pool = new pg.Pool({
    connectionString: process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

async function main() {
    try {
        const res = await pool.query("SELECT * FROM workflows WHERE name = 'התראת פנייה - טופס צור קשר'");
        console.log("Workflow:", res.rows[0]);

        const logs = await pool.query("SELECT * FROM email_logs WHERE template_id = 'contact_form_alert' ORDER BY sent_at DESC LIMIT 5");
        console.log("Recent email logs for contact_form_alert:");
        console.table(logs.rows);
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

main();
