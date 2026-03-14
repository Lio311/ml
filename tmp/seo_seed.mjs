import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const mappings = [
  { hebrew: 'דיקאנטים', english: 'Decant', type: 'general' },
  { hebrew: 'דיקנטים', english: 'Decant', type: 'general' },
  { hebrew: 'דקאנטים', english: 'Decant', type: 'general' },
  { hebrew: 'דקנטים', english: 'Decant', type: 'general' },
  { hebrew: 'דוגמיות יוקרה', english: 'Luxury', type: 'general' }
];

async function seed() {
  const client = await pool.connect();
  try {
    for (const m of mappings) {
      await client.query(
        `INSERT INTO search_mappings (hebrew_term, english_term, type) 
         VALUES ($1, $2, $3) 
         ON CONFLICT (hebrew_term) DO UPDATE SET english_term = EXCLUDED.english_term`,
        [m.hebrew, m.english, m.type]
      );
      console.log(`Synced: ${m.hebrew} -> ${m.english}`);
    }
  } catch (err) {
    console.error('Seed error:', err);
  } finally {
    client.release();
    process.exit(0);
  }
}

seed();
