import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '../../../../../../lib/db';

export async function DELETE(req, { params }) {
    try {
        const { userId } = await auth();
        const { id, itemId } = await params;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
             // Verify ownership of the catalog first
             const ownerCheck = await client.query('SELECT id FROM user_catalogs WHERE id = $1 AND user_id = $2', [id, userId]);
             if (ownerCheck.rows.length === 0) {
                  return NextResponse.json({ error: 'Catalog not found or unauthorized' }, { status: 404 });
             }

            const res = await client.query('DELETE FROM user_catalog_items WHERE id = $1 AND catalog_id = $2 RETURNING id', [itemId, id]);
            
            if (res.rowCount === 0) {
                 return NextResponse.json({ error: 'Item not found' }, { status: 404 });
            }

            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting catalog item:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
