import { NextResponse } from 'next/server';
import pool from './db';
import { currentUser } from '@clerk/nextjs/server';
import { recordAuditLog } from './audit';

/**
 * A Higher-Order Function to wrap Admin API routes.
 * Handles authentication, database connection lifecycle, and automatic audit logging.
 * 
 * @param {Function} handler - The original API route handler. Receives (req, context) where context includes { params, client, user, role }.
 * @param {Object} options - Configuration options.
 * @param {string[]} [options.allowedRoles] - Roles allowed to access this endpoint (defaults to admin, deputy, warehouse, viewer).
 */
export function withAdminApi(handler, options = {}) {
    return async (req, context = {}) => {
        const { allowedRoles = ['admin', 'deputy', 'warehouse', 'viewer'] } = options;
        
        // 1. Authentication & Authorization
        const user = await currentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses?.[0]?.emailAddress;
        const isSuperAdmin = email === process.env.ADMIN_EMAIL;

        if (!isSuperAdmin && !allowedRoles.includes(role)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        // 2. Database Connection Management
        let client;
        try {
            client = await pool.connect();
            
            // Inject client, user, and role into the context for the handler to use
            const enhancedContext = { ...context, client, user, role, isSuperAdmin };
            
            // Clone the request BEFORE the handler consumes it
            let bodyDetails = null;
            if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
                try {
                    const clonedReq = req.clone();
                    bodyDetails = await clonedReq.json();
                } catch (e) {
                    // Ignore body parsing errors for audit log
                }
            }
            
            // 3. Execute original handler
            const response = await handler(req, enhancedContext);
            
            // 4. Automatic Audit Logging (Only if successful and it's a mutation)
            if (response.ok && ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {

                // Try to infer entityType from URL
                const url = new URL(req.url);
                const pathParts = url.pathname.split('/').filter(Boolean);
                const entityType = pathParts.length > 2 ? pathParts[2] : 'unknown'; // e.g. /api/admin/inventory -> inventory

                await recordAuditLog({
                    userId: user.id,
                    action: `${req.method}_${entityType}`.toUpperCase(),
                    entityType: entityType,
                    details: bodyDetails,
                    req: req
                });
            }

            return response;
        } catch (error) {
            console.error(`[withAdminApi] Error in ${req.method} ${req.url}:`, error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        } finally {
            // GUARANTEED CONNECTION RELEASE
            if (client) {
                client.release();
            }
        }
    };
}
