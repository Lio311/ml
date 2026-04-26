import pool from './db';

/**
 * Default config values for each automation slug.
 * These match the original hardcoded values so that if the DB row is missing,
 * everything continues to work exactly as before.
 */
const DEFAULTS = {
    cart_recovery: { delay_hours: 3, cooldown_days: 7, discount_percent: 5, coupon_validity_hours: 24 },
    nurture_10_days: { delay_days: 10 },
    nurture_25_days: { delay_days: 25 },
    review_request: { delay_days: 7 },
    educational_email: { delay_days: 3 },
    recommendations_send: { delay_days: 30 },
};

/**
 * Fetches the config for an automation slug from the DB.
 * Falls back to hardcoded defaults if the row doesn't exist or on error.
 */
export async function getAutomationConfig(slug) {
    const defaults = DEFAULTS[slug] || {};
    try {
        const res = await pool.query('SELECT config FROM automation_config WHERE slug = $1', [slug]);
        if (res.rows.length > 0 && res.rows[0].config) {
            return { ...defaults, ...res.rows[0].config };
        }
    } catch (err) {
        console.error(`[automationConfig] Error fetching config for "${slug}", using defaults:`, err.message);
    }
    return defaults;
}

/**
 * Checks if a specific workflow (by name) is active.
 * Returns true by default if the workflow is not found (safe fallback).
 */
export async function isAutomationActive(workflowName) {
    try {
        const res = await pool.query('SELECT is_active FROM workflows WHERE name = $1 LIMIT 1', [workflowName]);
        if (res.rows.length > 0) {
            return res.rows[0].is_active;
        }
    } catch (err) {
        console.error(`[automationConfig] Error checking active status for "${workflowName}":`, err.message);
    }
    // Default: active (don't break existing behavior if workflow row doesn't exist)
    return true;
}

/**
 * Updates the automation_config for a given slug.
 */
export async function setAutomationConfig(slug, config) {
    try {
        await pool.query(`
            INSERT INTO automation_config (slug, config, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (slug) DO UPDATE SET config = $2, updated_at = NOW()
        `, [slug, JSON.stringify(config)]);
    } catch (err) {
        console.error(`[automationConfig] Error saving config for "${slug}":`, err.message);
    }
}
