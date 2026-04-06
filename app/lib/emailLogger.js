import pool from './db';

/**
 * Logs an email event to the database.
 * @param {Object} params
 * @param {string} params.recipient - Recipient email address
 * @param {string} params.subject - Email subject line
 * @param {string} params.type - Category of the email (e.g., 'reward', 'recovery')
 * @param {string} params.status - 'sent' or 'failed'
 * @param {string} [params.error] - Error message if failed
 * @param {number} [params.orderId] - Optional order ID associated with the email
 */
export async function logEmail({ recipient, subject, type, status, error = null, orderId = null }) {
    try {
        await pool.query(`
            INSERT INTO email_logs (recipient, subject, type, status, error_message, order_id)
            VALUES ($1, $2, $3, $4, $5, $6)
        `, [recipient, subject, type, status, error, orderId]);
    } catch (err) {
        console.error('[EmailLogger] Failed to log email to DB:', err);
    }
}
