import pool from './db';

/**
 * Logs an email event to the database.
 * @param {Object} params
 * @param {string} params.recipient - Recipient email address
 * @param {string} params.subject - Email subject line
 * @param {string} params.type - Category of the email (e.g., 'reward', 'recovery', 'campaign')
 * @param {string} params.status - 'sent' or 'failed'
 * @param {string} [params.error] - Error message if failed
 * @param {number} [params.orderId] - Optional order ID associated with the email
 * @param {number} [params.campaignId] - Optional campaign ID associated with the email
 */
export async function logEmail({ recipient, subject, type, status, error = null, orderId = null, campaignId = null }) {
    try {
        // Ensure campaign_id column exists (one-time check/migration)
        await pool.query('ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS campaign_id INTEGER');

        await pool.query(`
            INSERT INTO email_logs (recipient, subject, type, status, error_message, order_id, campaign_id)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
        `, [recipient, subject, type, status, error, orderId, campaignId]);
    } catch (err) {
        console.error('[EmailLogger] Failed to log email to DB:', err);
    }
}
