import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '.env.local') });

const pool = new Pool({
    connectionString: process.env.POSTGRES_URL,
});

async function testDailySummaryQuery() {
    console.log("Testing daily summary query...");
    const adminEmail = 'lior31197@gmail.com';
    try {
        const res = await pool.query(`
            SELECT subject, recipient, sent_at, type, status 
            FROM email_logs 
            WHERE (sent_at AT TIME ZONE 'Asia/Jerusalem')::date = (NOW() AT TIME ZONE 'Asia/Jerusalem')::date
            AND recipient NOT ILIKE $1
            ORDER BY sent_at DESC
        `, [`%${adminEmail}%`]);
        
        console.log("Filtered daily summary rows (first 5):");
        res.rows.slice(0, 5).forEach(r => console.log(`- ${r.recipient} | ${r.subject} | ${r.type}`));
        
        const allRes = await pool.query(`
            SELECT subject, recipient, sent_at, type, status 
            FROM email_logs 
            WHERE (sent_at AT TIME ZONE 'Asia/Jerusalem')::date = (NOW() AT TIME ZONE 'Asia/Jerusalem')::date
        `);
        console.log(`Total emails today: \${allRes.rows.length}`);
        console.log(`Emails after admin exclusion: \${res.rows.length}`);
    } catch (e) {
        console.error("Query error:", e);
    }
}

testDailySummaryQuery().then(() => process.exit(0));
