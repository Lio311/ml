import pool from '@/app/lib/db';

let cache = null;
let lastFetch = 0;
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

export async function getHebrewMapping() {
    if (cache && (Date.now() - lastFetch < CACHE_DURATION)) {
        return cache;
    }

    try {
        const client = await pool.connect();
        try {
            // Check if table exists first to avoid crashing if setup hasn't run
            // Or just try query
            const res = await client.query("SELECT hebrew_term, english_term FROM search_mappings");

            const mapping = {};
            res.rows.forEach(row => {
                mapping[row.hebrew_term.toLowerCase()] = row.english_term;
            });

            cache = mapping;
            lastFetch = Date.now();
            return mapping;
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("Mapping fetch error (Table might not exist yet):", e);
        // Fallback to minimal if DB fails or empty to prevent search crash
        return {};
    }
}

/**
 * Maps a potentially Hebrew query to an English search term.
 * Looks for exact matches or partial matches in the mapping from DB.
 * @param {string} query 
 * @returns {Promise<string>} The original query or the mapped English term.
 */
export async function mapHebrewQuery(query) {
    if (!query) return query;
    const lowerQuery = query.toLowerCase().trim();

    const mapping = await getHebrewMapping();

    // 1. Direct Match
    if (mapping[lowerQuery]) {
        return mapping[lowerQuery];
    }

    // 2. Partial Scan
    for (const [hebrew, english] of Object.entries(mapping)) {
        if (lowerQuery.includes(hebrew)) {
            return lowerQuery.replace(hebrew, english);
        }
    }

    return query;
}
