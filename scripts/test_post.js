const { Pool } = require('pg');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        const brand = "TestBrand";
        const model = "TestModel";
        const price_2ml = 10;
        const price_5ml = 20;
        const price_10ml = 30;
        const image_url = "";
        const category = "";
        const description = "";
        const stock = 10;
        const top_notes = "";
        const middle_notes = "";
        const base_notes = "";
        const in_lottery = true;
        const show_on_home = true;
        const name_he = "";
        const brand_he = "";
        const model_he = "";
        const cost_price = 5;
        const original_size = 100;
        const seasons = "";
        const perfumers = "";
        const country = "";
        const category_en = "General";
        const description_en = "";
        const top_notes_en = "";
        const middle_notes_en = "";
        const base_notes_en = "";
        const seasons_en = "";
        const newSlug = "test-brand-test-model";
        const active = true;
        const discount_percentage = 0;
        const discount_sizes = [];
        const discount_end_date = null;

        const res = await pool.query(
            `INSERT INTO products 
              (name, category, brand, model, price_2ml, price_5ml, price_10ml, image_url, 
               description, stock, top_notes, middle_notes, base_notes, in_lottery, show_on_home,
               name_he, brand_he, model_he, cost_price, original_size,
               seasons, perfumers, country,
               category_en, description_en, top_notes_en, middle_notes_en, base_notes_en, seasons_en, slug, active,
               discount_percentage, discount_sizes, discount_end_date) 
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $34, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33) 
             RETURNING id`,
            [
                brand + ' ' + model, category || 'General', brand, model, price_2ml, price_5ml, price_10ml, image_url,
                description, stock || 0, top_notes, middle_notes, base_notes, in_lottery ?? true, 
                name_he, brand_he, model_he, cost_price, original_size,
                seasons, perfumers, country,
                category_en, description_en, top_notes_en, middle_notes_en, base_notes_en, seasons_en, newSlug, active ?? true,
                discount_percentage || 0, discount_sizes || [], discount_end_date || null, show_on_home ?? true
            ]
        );
        console.log('Success:', res.rows[0]);
    } catch(e) { console.error('SQL Error:', e); } finally { pool.end(); }
}
run();
