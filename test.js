const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require' });
async function main() {
    try {
        await pool.query("UPDATE email_templates SET content_html = REPLACE(content_html, '28 לחודש', '9 לחודש') WHERE slug = 'admin_monthly_recommendation_reminder'");
        console.log('Template updated!');
    } finally {
        pool.end();
    }
}
main();
