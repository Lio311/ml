const pool = require('./app/lib/db');

async function debugTemplates() {
    try {
        const res = await pool.query('SELECT id, name, subject, slug, type FROM email_templates ORDER BY id DESC LIMIT 5');
        console.log('--- RECENT TEMPLATES ---');
        console.table(res.rows);
    } catch (err) {
        console.error('Debug failed:', err);
    } finally {
        process.exit();
    }
}

debugTemplates();
