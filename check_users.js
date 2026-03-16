import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require",
    ssl: { rejectUnauthorized: false }
});

async function checkUsers() {
    try {
        const { rows } = await pool.query('SELECT * FROM users');
        console.log("Users:");
        rows.forEach(u => console.log(` - ${u.id}: ${u.first_name} ${u.last_name} (${u.role}) ${u.email}`));
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkUsers();
