require('dotenv').config({path: '.env.local'});
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query("ALTER TABLE products ADD COLUMN IF NOT EXISTS volume_label_en VARCHAR(255)")
    .then(() => pool.query("UPDATE products SET description_en = 'Discover the magical world of Vivamor with this luxurious discovery set. The set includes 10 vials of 2ml each, allowing you to experience the leading and most beloved fragrances of the house. The perfect opportunity to find your next signature scent in the comfort of your home, before committing to a full-size bottle.', volume_label_en = '10 vials of 2ml' WHERE brand = 'Vivamor' AND model = 'Sampler Set'"))
    .then(() => console.log('Successfully updated product!'))
    .catch(console.error)
    .finally(() => pool.end());
