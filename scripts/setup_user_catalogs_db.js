require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function setupUserCatalogsTable() {
    const client = await pool.connect();
    try {
        console.log('Creating user_catalogs and user_catalog_items tables...');

        // 1. Create User Catalogs Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_catalogs (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) REFERENCES users(id) ON DELETE CASCADE,
                slug VARCHAR(255) UNIQUE NOT NULL,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                image_url TEXT,
                contact_email VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('user_catalogs table created/verified.');

        // 2. Create User Catalog Items Table
        await client.query(`
            CREATE TABLE IF NOT EXISTS user_catalog_items (
                id SERIAL PRIMARY KEY,
                catalog_id INTEGER REFERENCES user_catalogs(id) ON DELETE CASCADE,
                name VARCHAR(255) NOT NULL,
                description TEXT,
                price INTEGER NOT NULL,
                image_url TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('user_catalog_items table created/verified.');

        // 3. Optional: Add catalog_id to orders table (if it doesn't exist)
        // We catch errors here in case the column already exists (no IF NOT EXISTS for column in standard postgres without DO block)
        try {
            await client.query(`
                ALTER TABLE orders ADD COLUMN catalog_id INTEGER REFERENCES user_catalogs(id) ON DELETE SET NULL;
            `);
            console.log('Added catalog_id column to orders table.');
        } catch (alterError) {
            if (alterError.code === '42701') { // 42701 is "duplicate_column"
                console.log('catalog_id column already exists in orders table.');
            } else {
                console.error('Error adding catalog_id to orders (might involve table rebuild or constraints):', alterError.message);
            }
        }


        console.log('Database setup for User Catalogs completed successfully.');
    } catch (error) {
        console.error('Error setting up user catalogs tables:', error);
    } finally {
        client.release();
        process.exit();
    }
}

setupUserCatalogsTable();
