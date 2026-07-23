import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

export async function DELETE(req, props) {
    try {
        const params = await props.params;
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const subscriptionId = params.id;

        const client = await pool.connect();
        try {
            await client.query('DELETE FROM back_in_stock_subscriptions WHERE id = $1', [subscriptionId]);
            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting stock subscription:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
