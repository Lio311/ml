import pool from './db';

/**
 * Records an action to the audit logs.
 * @param {Object} params
 * @param {string} params.userId - The user performing the action.
 * @param {string} params.action - The action performed (e.g., 'update_catalog', 'delete_order').
 * @param {string} params.entityType - The type of entity affected (e.g., 'catalog', 'order', 'product').
 * @param {string} [params.entityId] - The ID of the affected entity.
 * @param {Object} [params.details] - Additional JSON details about the change.
 * @param {Request} [params.req] - The request object to extract IP and User-Agent.
 */
export async function recordAuditLog({ userId, action, entityType, entityId, details, req }) {
    let client;
    try {
        let ip = 'unknown';
        let ua = 'unknown';

        if (req) {
            ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
            ua = req.headers.get('user-agent') || 'unknown';
        }

        client = await pool.connect();
        await client.query(
            `INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, action, entityType, entityId || null, details ? JSON.stringify(details) : null, ip, ua]
        );
    } catch (error) {
        console.error('Failed to record audit log:', error);
        // We don't throw here to avoid failing the main request if logging fails
    } finally {
        if (client) client.release();
    }
}
