import { Pool } from 'pg';
import { unstable_cache } from 'next/cache';
import * as Sentry from "@sentry/nextjs";

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

/**
 * CACHED DATA FETCHERS (Performance Improvement)
 */
export const getBrands = unstable_cache(
    async () => {
        try {
            const res = await pool.query('SELECT name, logo_url FROM brands ORDER BY LOWER(name) ASC');
            return res.rows;
        } catch (err) {
            Sentry.captureException(err);
            console.error("Error fetching brands from DB, using empty array fallback during build:", err.message);
            return []; // Fallback to empty array to allow build to continue
        }
    },
    ['global-brands-v4'],
    { revalidate: 3600, tags: ['globals', 'brands', 'v4'] }
);

export const getMenuItems = unstable_cache(
    async () => {
        try {
            const settingsRes = await pool.query("SELECT value FROM site_settings WHERE key = 'main_menu'");
            if (settingsRes.rows.length > 0 && settingsRes.rows[0].value && settingsRes.rows[0].value.length > 0) {
                return settingsRes.rows[0].value.sort((a, b) => a.order - b.order);
            }
        } catch (err) {
            Sentry.captureException(err);
            console.error("Error fetching menu from DB, using fallback", err.message);
        }

        // Fallback Menu
        return [
            { id: 'brands', label: 'מותגים', path: '/brands', order: 1, visible: true },
            { id: 'catalog', label: 'קטלוג', path: '/catalog', order: 2, visible: true },
            { id: 'categories', label: 'קטגוריות', path: '/categories', order: 3, visible: true },
            { id: 'lottery', label: 'הגרלת בשמים', path: '/lottery', order: 4, isRed: true, visible: true },
            { id: 'matching', label: 'התאמת מארזים', path: '/matching', order: 5, visible: true },
            { id: 'about', label: 'אודות', path: '/about', order: 6, visible: true },
            { id: 'contact', label: 'צור קשר', path: '/contact', order: 7, visible: true },
        ];
    },
    ['global-menu'],
    { revalidate: 3600, tags: ['globals', 'menu'] }
);

export const getBrandInsight = unstable_cache(
    async (brandName) => {
        const normalized = (brandName || '').trim();
        try {
            const res = await pool.query(`
                SELECT name, title, description, perfumer, highlights, logo_url,
                       title_en, description_en, perfumer_en, highlights_en
                FROM brands 
                WHERE name ILIKE $1 
                LIMIT 1
            `, [normalized || 'NONE']);
            
            const dbBrand = res.rows[0];
            const { getBrandInsight: getLegacyInsight } = require('./brandData');
            const fallback = getLegacyInsight(normalized) || {};

            if (!dbBrand) return fallback;

            // Merge logic: prefer DB, but use fallback for nulls
            const merged = { ...fallback };
            for (const key of Object.keys(dbBrand)) {
                if (dbBrand[key] !== null) {
                    merged[key] = dbBrand[key];
                }
            }
            return merged;
        } catch (err) {
            Sentry.captureException(err);
            try {
                const { getBrandInsight: getLegacyInsight } = require('./brandData');
                return getLegacyInsight(normalized);
            } catch (e) {
                return null;
            }
        }
    },
    ['brand-insights-v3'],
    { revalidate: 3600, tags: ['brands', 'insights', 'v3'] }
);

/**
 * Wrapper for database operations that ensures the client is released back to the pool.
 * @param {Function} callback - Async function that receives the client and performs queries.
 */
export async function withClient(callback) {
    const client = await pool.connect();
    try {
        return await callback(client);
    } catch (err) {
        Sentry.captureException(err);
        throw err;
    } finally {
        client.release();
    }
}

/**
 * Standard query wrapper with Sentry logging
 */
export async function query(text, params) {
    try {
        return await pool.query(text, params);
    } catch (err) {
        Sentry.captureException(err);
        throw err;
    }
}

export default pool;
