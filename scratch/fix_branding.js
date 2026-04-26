const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function fixBranding() {
    try {
        console.log("Checking for uppercase 'ML_TLV' in blog_posts...");
        
        // Update content
        const updateContent = await pool.query(`
            UPDATE blog_posts 
            SET content = REPLACE(REPLACE(content, 'ML_TLV', 'ml-tlv'), 'ML-TLV', 'ml-tlv'),
                content_en = REPLACE(REPLACE(content_en, 'ML_TLV', 'ml-tlv'), 'ML-TLV', 'ml-tlv'),
                title = REPLACE(REPLACE(title, 'ML_TLV', 'ml-tlv'), 'ML-TLV', 'ml-tlv'),
                title_en = REPLACE(REPLACE(title_en, 'ML_TLV', 'ml-tlv'), 'ML-TLV', 'ml-tlv'),
                excerpt = REPLACE(REPLACE(excerpt, 'ML_TLV', 'ml-tlv'), 'ML-TLV', 'ml-tlv'),
                excerpt_en = REPLACE(REPLACE(excerpt_en, 'ML_TLV', 'ml-tlv'), 'ML-TLV', 'ml-tlv')
            WHERE content ILIKE '%ML_TLV%' 
               OR content ILIKE '%ML-TLV%'
               OR content_en ILIKE '%ML_TLV%' 
               OR content_en ILIKE '%ML-TLV%'
               OR title ILIKE '%ML_TLV%' 
               OR title ILIKE '%ML-TLV%'
               OR excerpt ILIKE '%ML_TLV%'
               OR excerpt ILIKE '%ML-TLV%'
        `);
        
        console.log(`Updated ${updateContent.rowCount} blog posts.`);
        
        // Also check if there's any 'ml_tlv' in uppercase elsewhere in site_settings
        const updateSettings = await pool.query(`
            UPDATE site_settings
            SET value = CAST(REPLACE(CAST(value AS TEXT), 'ML_TLV', 'ml_tlv') AS JSONB)
            WHERE CAST(value AS TEXT) LIKE '%ML_TLV%'
        `);
        
        console.log(`Updated ${updateSettings.rowCount} settings.`);

    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

fixBranding();
