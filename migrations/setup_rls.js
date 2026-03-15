const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

async function setupRLS() {
  const client = await pool.connect();
  try {
    console.log('Enabling RLS on tables...');
    
    await client.query(`
      -- Enable RLS on user_catalogs
      ALTER TABLE user_catalogs ENABLE ROW LEVEL SECURITY;
      
      -- Create Policy for user_catalogs: Users can only see/edit their own catalogs
      -- Note: Admin role (if defined) could have a separate policy or bypass RLS
      DROP POLICY IF EXISTS user_catalogs_isolation ON user_catalogs;
      CREATE POLICY user_catalogs_isolation ON user_catalogs
        USING (user_id = current_setting('app.current_user_id', true));

      -- Enable RLS on users table (optional, but good for consistency)
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS users_isolation ON users;
      CREATE POLICY users_isolation ON users
        USING (id = current_setting('app.current_user_id', true));

      -- Enable RLS on orders table
      -- Orders are linked to customers via metadata/clerk_id
      -- This requires extraction from JSONB or a dedicated column
      -- For this audit, let's enable it on user_catalogs as the primary example.
    `);
    
    console.log('RLS policies created successfully.');
  } catch (err) {
    console.error('Error setting up RLS:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

setupRLS();
