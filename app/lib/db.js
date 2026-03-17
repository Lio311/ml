import { Pool } from 'pg';

let pool;

if (process.env.NODE_ENV === 'production') {
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
} else {
    if (!global.pool) {
        global.pool = new Pool({
            connectionString: process.env.DATABASE_URL,
            ssl: {
                rejectUnauthorized: false
            }
        });
    }
    pool = global.pool;
}

/**
 * Gets a client from the pool and sets the current user ID for RLS.
 * @param {string} userId - The Clerk user ID.
 * @returns {Promise<import('pg').PoolClient>}
 */
export async function getAuthenticatedClient(userId) {
    const client = await pool.connect();
    if (userId) {
        // Set the session variable used by RLS policies
        // Using SET LOCAL ensures it only lasts for the current transaction/connection session
        await client.query(`SELECT set_config('app.current_user_id', $1, true)`, [userId]);
    }
    return client;
}

/**
 * Proactively updates the user's last_active_at timestamp.
 * @param {string} userId - The Clerk user ID.
 */
export async function updateUserActivity(userId) {
    if (!userId) return;
    try {
        await pool.query(`
            INSERT INTO users (id, last_active_at, created_at, updated_at)
            VALUES ($1, NOW(), NOW(), NOW())
            ON CONFLICT (id) 
            DO UPDATE SET 
                last_active_at = NOW(),
                updated_at = NOW()
        `, [userId]);
    } catch (err) {
        console.error('Error updating user activity:', err);
    }
}

export default pool;
