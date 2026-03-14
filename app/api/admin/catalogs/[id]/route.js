import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '../../../../../lib/db';

export async function DELETE(req, { params }) {
    try {
        const { userId, sessionClaims } = await auth();
        const { id } = await params;

        if (!userId) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Basic admin check
        const role = sessionClaims?.metadata?.role;
        const userEmail = sessionClaims?.email || '';
        
        if (role !== 'admin' && userEmail !== 'lior31197@gmail.com') {
             // return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const client = await pool.connect();
        try {
            // Because of ON DELETE CASCADE in the DB schema, deleting the catalog
            // will also delete all associated user_catalog_items.
            const res = await client.query('DELETE FROM user_catalogs WHERE id = $1 RETURNING id', [id]);
            
            if (res.rowCount === 0) {
                 return NextResponse.json({ error: 'Catalog not found' }, { status: 404 });
            }

            return NextResponse.json({ success: true, deletedId: id });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error Admin deleting catalog:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
