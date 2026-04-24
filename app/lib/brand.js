/**
 * Brand Name Utility (Server-side)
 * Central source of truth for the brand name across all server components,
 * metadata, and email templates.
 */
import pool from '@/app/lib/db';

let _cachedBrand = null;
let _cacheTime = 0;
const CACHE_TTL = 60_000; // 1 minute

const DEFAULT_BRAND = {
    name: 'ml_tlv',
    displayDot: 'ml.',
    displayHyphen: 'ml-tlv',
    instagram: 'ml_tlv',
    fullTitle: 'ml_tlv | דוגמיות בשמים',
};

/**
 * Fetches the brand name from the DB (with 1-minute in-process cache).
 * Falls back to DEFAULT_BRAND if not set.
 */
export async function getBrand() {
    const now = Date.now();
    if (_cachedBrand && (now - _cacheTime) < CACHE_TTL) {
        return _cachedBrand;
    }
    try {
        const client = await pool.connect();
        try {
            const res = await client.query(
                "SELECT value FROM site_settings WHERE key = 'brand_name'"
            );
            if (res.rows.length > 0) {
                const stored = res.rows[0].value;
                _cachedBrand = buildVariants(stored.name || DEFAULT_BRAND.name);
                _cacheTime = now;
                return _cachedBrand;
            }
        } finally {
            client.release();
        }
    } catch (e) {
        // DB unavailable — use default silently
    }
    return buildVariants(DEFAULT_BRAND.name);
}

/**
 * Convenience shortcut — returns just the primary brand display name.
 */
export async function getBrandName() {
    const b = await getBrand();
    return b.name;
}

/**
 * Builds all display variants from a base brand name string.
 * e.g. "ml_tlv" → { name: "ml_tlv", dot: "ml.", hyphen: "ml-tlv", ... }
 * e.g. "MySite" → { name: "MySite", dot: "MySite.", hyphen: "MySite", ... }
 */
export function buildVariants(name) {
    return {
        name,                                        // ml_tlv  / MySite
        dot: name.split('_')[0] + '.',              // ml.     / MySite.
        hyphen: name.replace(/_/g, '-'),            // ml-tlv  / MySite
        short: name.split('_')[0],                  // ml      / MySite
        instagram: name,                             // ml_tlv  / MySite
        titleSuffix: ` | ${name}`,                  // " | ml_tlv"
        fullTitle: `${name} | דוגמיות בשמים`,
    };
}

/**
 * Invalidates the server-side cache (called after brand name is updated via admin).
 */
export function invalidateBrandCache() {
    _cachedBrand = null;
    _cacheTime = 0;
}
