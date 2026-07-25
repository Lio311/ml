const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'app/product/[slug]/page.js');
let content = fs.readFileSync(filePath, 'utf8');

// Replace the first query (generateMetadata)
content = content.replace(
    /SELECT id, slug, brand, brand_he, model, model_he, name, name_he, description, description_he, image_url, category, stock,\s*discount_percentage, discount_sizes, discount_end_date/,
    'SELECT id, slug, brand, brand_he, model, model_he, name, name_he, description, description_he, image_url, image_url_2, image_url_3, category, stock, discount_percentage, discount_sizes, discount_end_date'
);

// Replace the second query (ProductPage)
content = content.replace(
    /SELECT id, slug, brand, brand_he, model, model_he, name, name_he, description, description_he, image_url, category,\s*stock, active, price_2ml, price_5ml, price_10ml,\s*discount_percentage, discount_sizes, discount_end_date,\s*top_notes, top_notes_en, middle_notes, middle_notes_en, base_notes, base_notes_en,\s*seasons, seasons_en, perfumers, perfumers_en, review_count, average_rating, spotify_track_url/,
    'SELECT id, slug, brand, brand_he, model, model_he, name, name_he, description, description_he, image_url, image_url_2, image_url_3, category, stock, active, single_price, volume_label, price_2ml, price_5ml, price_10ml, discount_percentage, discount_sizes, discount_end_date, top_notes, top_notes_en, middle_notes, middle_notes_en, base_notes, base_notes_en, seasons, seasons_en, perfumers, perfumers_en, review_count, average_rating, is_discovery_set, discovery_type, spotify_track_url'
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Updated page.js queries');
