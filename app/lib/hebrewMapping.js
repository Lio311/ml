import { withClient } from './db.js';

let cache = null;
let lastFetch = 0;
const CACHE_DURATION = 1000 * 60 * 5; // 5 minutes

export async function getHebrewMapping() {
    if (cache && (Date.now() - lastFetch < CACHE_DURATION)) {
        return cache;
    }

    try {
        return await withClient(async (client) => {
            const res = await client.query("SELECT hebrew_term, english_term FROM search_mappings");

            const mapping = {};
            res.rows.forEach(row => {
                mapping[row.hebrew_term.toLowerCase()] = row.english_term;
            });

            cache = mapping;
            lastFetch = Date.now();
            return mapping;
        });
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

    // Direct Match (High Priority)
    if (mapping[lowerQuery] !== undefined) {
        return mapping[lowerQuery].trim();
    }

    // Sequential Replacements (Sorted by length descending to match specific terms first)
    let currentResult = lowerQuery;
    const sortedMappings = Object.entries(mapping).sort((a, b) => b[0].length - a[0].length);

    for (const [hebrew, english] of sortedMappings) {
        if (currentResult.includes(hebrew)) {
            // Use split/join for global replace without complex regex issues
            currentResult = currentResult.split(hebrew).join(english);
        }
    }

    return currentResult.trim();
}
