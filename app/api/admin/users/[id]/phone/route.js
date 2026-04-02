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
            const userRes = await client.query(
                `UPDATE users SET phone = $1 WHERE id = $2 RETURNING email`,
                [phone, id]
            );
            
            const userEmail = userRes.rows[0]?.email;
            console.log(`Syncing phone update for user ${id} (${userEmail}) to phone: ${phone}`);

            // 2. Sync with existing orders
            let updateRes;
            if (userEmail) {
                updateRes = await client.query(
                    `UPDATE orders 
                     SET customer_details = jsonb_set(customer_details, '{phone}', to_jsonb($1::text))
                     WHERE customer_details->>'clerk_id' = $2 
                        OR customer_details->>'email' = $3`,
                    [phone, id, userEmail]
                );
            } else {
                updateRes = await client.query(
                    `UPDATE orders 
                     SET customer_details = jsonb_set(customer_details, '{phone}', to_jsonb($1::text))
                     WHERE customer_details->>'clerk_id' = $2`,
                    [phone, id]
                );
            }

            console.log(`Orders sync complete. Rows affected: ${updateRes.rowCount}`);

            await client.query('COMMIT');
            return NextResponse.json({ success: true, rowsAffected: updateRes.rowCount });
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
