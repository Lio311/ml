const { Pool } = require('pg');

const pool = new Pool({
    connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require',
    ssl: { rejectUnauthorized: false }
});

const BRANDS_TO_TRANSLATE = {
    'Roja': {
        title_en: 'Roja Parfums: The Pinnacle of Global Perfumery',
        description_en: 'The "nose" behind the brand, known in the industry as one of the most talented and respected perfumers in history. After a glorious career in the largest perfume houses in France, Roja established his private brand with one goal: to create the best and most luxurious perfumes possible, without budget constraints. Each fragrance is derived from the world\'s finest ingredients - from Grasse jasmine and May rose to rare oud. Roja\'s scents are characterized by extraordinary complexity, with many layers of notes that are not only a perfume, but an olfactory experience that stays for many hours. For luxury perfume lovers, we are proud to present the accessible samples of Roja, an elitist, elegant and sophisticated brand that allows everyone to taste the unending luxury of the iconic London house.',
        highlights_en: 'Exclusive use of the most expensive natural ingredients, multi-layered fragrance complexity, and an unmatched luxury standard.',
        perfumer_en: 'Roja Dove (Master Perfumer)'
    }
};

async function translateBrands() {
    for (const [name, trans] of Object.entries(BRANDS_TO_TRANSLATE)) {
        console.log(`Updating brand: ${name}`);
        await pool.query(`
            UPDATE brands 
            SET title_en = $1, description_en = $2, highlights_en = $3, perfumer_en = $4
            WHERE name = $5
        `, [trans.title_en, trans.description_en, trans.highlights_en, trans.perfumer_en, name]);
    }
    
    // Also find any other brands that might need it
    const res = await pool.query("SELECT name, description, description_en FROM brands WHERE description_en ~ '[א-ת]' OR description_en IS NULL");
    console.log(`Found ${res.rows.length} more brands to check.`);
    for (const row of res.rows) {
        if (row.name !== 'Roja') {
             console.log(`Potential brand to translate: ${row.name}`);
        }
    }

    await pool.end();
}

translateBrands().catch(err => console.error(err));
