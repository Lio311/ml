import pool from '@/app/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function PATCH(req, { params }) {
    try {
        const { id } = await params;
        const { phone } = await req.json();

        // Admin Auth Check
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses[0]?.emailAddress;
        
        if (role !== 'admin' && email !== process.env.ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // 1. Update users table
            await client.query(
                `UPDATE users SET phone = $1 WHERE id = $2`,
                [phone, id]
            );

            // 2. Sync with existing orders (where clerk_id matches)
            // We use jsonb_set to update the 'phone' key inside customer_details
            await client.query(
                `UPDATE orders 
                 SET customer_details = jsonb_set(customer_details, '{phone}', to_jsonb($1::text))
                 WHERE customer_details->>'clerk_id' = $2`,
                [phone, id]
            );

            await client.query('COMMIT');
            return NextResponse.json({ success: true });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Error updating phone:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
