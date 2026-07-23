import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { currentUser } from '@clerk/nextjs/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function DELETE(req, props) {
    try {
        const params = await props.params;
        const user = await currentUser();
        const userEmail = user?.emailAddresses?.[0]?.emailAddress;
        const role = user?.publicMetadata?.role;

        if (!userEmail) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isSuperAdmin = userEmail === ADMIN_EMAIL;
        const currentRole = isSuperAdmin ? 'admin' : role;

        if (currentRole !== 'admin' && currentRole !== 'deputy') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const preorderId = params.id;

        const client = await pool.connect();
        try {
            await client.query('DELETE FROM preorders WHERE id = $1', [preorderId]);
            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting preorder:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
