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

export default pool;
