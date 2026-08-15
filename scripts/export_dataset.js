const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

async function exportDataset() {
    console.log("Connecting to Database...");
    const client = new Client({ connectionString: process.env.DATABASE_URL });
    await client.connect();

    try {
        const { rows } = await client.query(`
            SELECT name, name_he, brand, category, top_notes, middle_notes, base_notes, 
                   description, description_he, seasons
            FROM products 
            WHERE active = true
        `);

        console.log(`Found ${rows.length} products. Generating dataset...`);
        const dataset = [];

        for (const p of rows) {
            // English pair
            if (p.description) {
                dataset.push({
                    instruction: `Recommend and describe the perfume ${p.brand} ${p.name}.`,
                    input: `Category: ${p.category || ''}, Seasons: ${p.seasons || ''}`,
                    output: `The ${p.brand} ${p.name} is a highly recommended fragrance. Notes: Top: ${p.top_notes || 'N/A'}, Middle: ${p.middle_notes || 'N/A'}, Base: ${p.base_notes || 'N/A'}. Description: ${p.description}`
                });
            }

            // Hebrew pair
            if (p.description_he) {
                dataset.push({
                    instruction: `המלץ ותאר לי את הבושם ${p.brand} ${p.name_he || p.name}.`,
                    input: `קטגוריה: ${p.category || ''}, עונות: ${p.seasons || ''}`,
                    output: `הבושם ${p.brand} ${p.name_he || p.name} הוא בחירה מצוינת. תווי הריח שלו מורכבים מתווים עליונים: ${p.top_notes || ''}, תווי אמצע: ${p.middle_notes || ''}, ותווי בסיס: ${p.base_notes || ''}. תיאור הבושם: ${p.description_he}`
                });
            }
        }

        const tmpDir = path.join(__dirname, '../tmp');
        if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir);
        
        const outPath = path.join(tmpDir, 'perfume_dataset.jsonl');
        fs.writeFileSync(outPath, dataset.map(d => JSON.stringify(d)).join('\n'));
        console.log(`\nSuccess! Dataset exported to: ${outPath}`);
        console.log(`Total training examples generated: ${dataset.length}`);

    } catch (e) {
        console.error("Error generating dataset:", e);
    } finally {
        await client.end();
    }
}

exportDataset();
