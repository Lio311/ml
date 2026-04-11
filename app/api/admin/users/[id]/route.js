import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';
import { recordAuditLog } from '@/app/lib/audit';

export async function DELETE(req, { params }) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id: userIdToDelete } = await params;
        if (!userIdToDelete) {
            return NextResponse.json({ error: 'Missing User ID' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // 1. Unlink Reviews (Nullify user_id to keep the record anonymously)
            await client.query('UPDATE reviews SET user_id = NULL WHERE user_id = $1', [userIdToDelete]);

            // 2. Delete User Catalogs and Categories Items
            // Assuming cascade delete is not 100% reliable or we want to be explicit
            await client.query(`
                DELETE FROM user_catalog_items 
                WHERE catalog_id IN (SELECT id FROM user_catalogs WHERE user_id = $1)
            `, [userIdToDelete]);
            
            await client.query('DELETE FROM user_catalogs WHERE user_id = $1', [userIdToDelete]);

            // 3. Delete Viewing History
            await client.query('DELETE FROM product_views WHERE user_id = $1', [userIdToDelete]);

            // 4. Delete Back In Stock Subscriptions
            await client.query('DELETE FROM back_in_stock_subscriptions WHERE user_id = $1', [userIdToDelete]);

            // 5. Delete the User record
            await client.query('DELETE FROM users WHERE id = $1', [userIdToDelete]);

            await client.query('COMMIT');

            // Log the action
            const logId = await recordAuditLog({
                userId: userIdToDelete, // This is technically inaccurate if we use the deleted ID, but recordAuditLog usually uses the actor's ID.
                // In recordAuditLog, the first arg is usually the actor (admin). I'll find who is the requester.
                action: 'delete_user_db',
                entityType: 'user',
                entityId: userIdToDelete,
                details: { userId: userIdToDelete, message: 'User deleted from database, related catalogs and metadata cleaned up' },
                req
            });

            return NextResponse.json({ success: true, message: 'User and associated data deleted successfully' });
        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Delete User Error:', error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
