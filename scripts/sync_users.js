require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
});
// Note: We can't easily use the Clerk SDK in a standalone script without proper ESM setup or Babel provided by Next.js.
// However, we can use the Fetch API to call the Clerk Backend API directly if we have the Secret Key.
// OR, simpler for this environment: likely this script will be run with 'node', so standard require works.
// We will try to fetch via the app's internal API route or just use the Clerk SDK if 'import' is supported, but 'require' is safer for standalone node scripts.
// Actually, standard 'require' of @clerk/clerk-sdk-node might work if installed.
// Let's assume we can query the app's own API endpoint if the server is running, OR just use pg directly.

// Strategy: We will use a fetch against the running app's Admin API to get the JSON, then insert it.
// This avoids Clerk SDK versioning issues in standalone scripts.

const APP_URL = 'http://localhost:3000'; // Adjust if running on different port

async function syncUsers() {
    console.log("Starting User Sync...");
    const client = await pool.connect();

    try {
        // 1. Fetch Users from our own internal Admin API (which wraps Clerk)
        // We need to assume the server is running.
        // If not, we'd need to use the Clerk SDK here.
        // Let's try to dynamic import the SDK? No, complicated.
        // Let's rely on the Clerk Secret Key being in env and do a raw HTTP request to Clerk API.

        const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY;
        if (!CLERK_SECRET_KEY) {
            throw new Error("Missing CLERK_SECRET_KEY in .env.local");
        }

        console.log("Fetching users from Clerk API...");
        const clerkRes = await fetch('https://api.clerk.com/v1/users?limit=500', {
            headers: {
                'Authorization': `Bearer ${CLERK_SECRET_KEY}`,
                'Content-Type': 'application/json'
            }
        });

        if (!clerkRes.ok) {
            throw new Error(`Clerk API error: ${clerkRes.statusText}`);
        }

        const usersData = await clerkRes.json();
        console.log(`Fetched ${usersData.length} users from Clerk.`);

        // 2. Insert into Local DB
        console.log("Inserting into local DB...");

        // Use a transaction
        await client.query('BEGIN');

        for (const user of usersData) {
            const id = user.id;
            const email = user.email_addresses?.[0]?.email_address || '';
            const firstName = user.first_name || '';
            const lastName = user.last_name || '';
            const role = user.public_metadata?.role || 'customer';
            const createdAt = new Date(user.created_at); // Clerk sends timestamp? check format. 
            // Clerk API v1 returns 'created_at' as long (milliseconds).
            const createdDate = new Date(user.created_at);

            const query = `
                INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at)
                VALUES ($1, $2, $3, $4, $5, $6, NOW())
                ON CONFLICT (id) DO UPDATE SET
                    email = EXCLUDED.email,
                    first_name = EXCLUDED.first_name,
                    last_name = EXCLUDED.last_name,
                    role = EXCLUDED.role,
                    updated_at = NOW();
            `;

            await client.query(query, [id, email, firstName, lastName, role, createdDate]);
        }

        await client.query('COMMIT');
        console.log("Sync completed successfully.");

    } catch (err) {
        await client.query('ROLLBACK');
        console.error("Sync failed:", err);
    } finally {
        client.release();
        process.exit();
    }
}

syncUsers();
