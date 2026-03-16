const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function run() {
    try {
        await pool.query(`
            CREATE TABLE IF NOT EXISTS reviews (
                id SERIAL PRIMARY KEY,
                user_id VARCHAR(255) REFERENCES users(id),
                order_id INTEGER REFERENCES orders(id),
                content TEXT NOT NULL,
                rating INTEGER DEFAULT 5,
                is_public BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log("Reviews table created successfully.");
        process.exit(0);
    } catch (err) {
        console.error("Error creating reviews table:", err);
        process.exit(1);
    }
}
run();
