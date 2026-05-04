import pool from './db';

/**
 * Log an error to the error_logs table for the admin error monitoring dashboard.
 * Silently fails if the table doesn't exist yet.
 */
export async function logError({ endpoint, errorMessage, errorStack, statusCode, method, body, userAgent, ip }) {
    let client;
    try {
        client = await pool.connect();
        await client.query(
            `INSERT INTO error_logs (endpoint, error_message, error_stack, status_code, request_method, request_body, user_agent, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
                endpoint || 'unknown',
                (errorMessage || '').substring(0, 2000),
                (errorStack || '').substring(0, 5000),
                statusCode || 500,
                method || 'GET',
                body ? JSON.stringify(body).substring(0, 1000) : null,
                (userAgent || '').substring(0, 500),
                ip || 'unknown'
            ]
        );
    } catch (e) {
        // Silently fail — we don't want error logging to cause more errors
        // This will fail if the table doesn't exist yet, which is fine
    } finally {
        if (client) client.release();
    }
}

/**
 * Log a cron job execution to cron_logs.
 */
export async function logCronStart(cronName) {
    let client;
    try {
        client = await pool.connect();
        const result = await client.query(
            `INSERT INTO cron_logs (cron_name, status, started_at) VALUES ($1, 'running', NOW()) RETURNING id`,
            [cronName]
        );
        return result.rows[0]?.id;
    } catch (e) {
        return null;
    } finally {
        if (client) client.release();
    }
}

export async function logCronEnd(logId, status, message, durationMs) {
    if (!logId) return;
    let client;
    try {
        client = await pool.connect();
        await client.query(
            `UPDATE cron_logs SET status = $1, message = $2, duration_ms = $3, finished_at = NOW() WHERE id = $4`,
            [status, (message || '').substring(0, 2000), durationMs, logId]
        );
    } catch (e) {
        // Silent fail
    } finally {
        if (client) client.release();
    }
}
