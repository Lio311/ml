const { Pool } = require('pg');

const DATABASE_URL = "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require";

const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log("Starting database migration...");

        // Products
        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS name_en VARCHAR(255),
            ADD COLUMN IF NOT EXISTS description_en TEXT,
            ADD COLUMN IF NOT EXISTS category_en VARCHAR(100),
            ADD COLUMN IF NOT EXISTS seasons_en VARCHAR(255),
            ADD COLUMN IF NOT EXISTS country_en VARCHAR(100),
            ADD COLUMN IF NOT EXISTS perfumers_en VARCHAR(255),
            ADD COLUMN IF NOT EXISTS top_notes_en TEXT,
            ADD COLUMN IF NOT EXISTS middle_notes_en TEXT,
            ADD COLUMN IF NOT EXISTS base_notes_en TEXT
        `);
        console.log("Products table updated.");

        // Brands
        await client.query(`
            ALTER TABLE brands 
            ADD COLUMN IF NOT EXISTS title_en VARCHAR(255),
            ADD COLUMN IF NOT EXISTS description_en TEXT,
            ADD COLUMN IF NOT EXISTS highlights_en TEXT,
            ADD COLUMN IF NOT EXISTS perfumer_en VARCHAR(255)
        `);
        console.log("Brands table updated.");

        // Blog Posts
        await client.query(`
            ALTER TABLE blog_posts 
            ADD COLUMN IF NOT EXISTS title_en VARCHAR(255),
            ADD COLUMN IF NOT EXISTS excerpt_en TEXT,
            ADD COLUMN IF NOT EXISTS content_en TEXT,
            ADD COLUMN IF NOT EXISTS tags_en TEXT[]
        `);
        console.log("Blog Posts table updated.");

        console.log("Migration completed successfully!");
    } catch (err) {
        console.error("Migration failed:", err);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
