import { NextResponse } from 'next/server';
import { checkAdmin } from '@/app/lib/admin';
import pool from '@/app/lib/db';

export async function DELETE(req, { params }) {
    let client;
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        client = await pool.connect();

        // Because of ON DELETE CASCADE in the DB schema, deleting the catalog
        // will also delete all associated user_catalog_items.
        const res = await client.query('DELETE FROM user_catalogs WHERE id = $1 RETURNING id', [id]);
        
        if (res.rowCount === 0) {
            return NextResponse.json({ error: 'Catalog not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, deletedId: id });
    } catch (error) {
        console.error('Error Admin deleting catalog:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}
