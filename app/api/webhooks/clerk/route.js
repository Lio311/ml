
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function POST(req) {
    // You can find this in the Clerk Dashboard -> Webhooks -> choose the webhook
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
    }

    // Get the headers
    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    // If there are no headers, error out
    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new NextResponse('Error occured -- no svix headers', {
            status: 400
        });
    }

    // Get the body
    const payload = await req.json();
    const body = JSON.stringify(payload);

    // Create a new Svix instance with your secret.
    const wh = new Webhook(WEBHOOK_SECRET);

    let evt;

    // Verify the payload with the headers
    try {
        evt = wh.verify(body, {
            "svix-id": svix_id,
            "svix-timestamp": svix_timestamp,
            "svix-signature": svix_signature,
        });
    } catch (err) {
        console.error('Error verifying webhook:', err);
        return new NextResponse('Error occured', {
            status: 400
        });
    }

    // Handle the event
    const eventType = evt.type;

    if (eventType === 'user.created' || eventType === 'user.updated') {
        const { id, email_addresses, first_name, last_name, public_metadata, created_at } = evt.data;
        const email = email_addresses?.[0]?.email_address || '';
        const role = public_metadata?.role || 'customer';

        // Clerk sends timestamps in ms
        const createdDate = new Date(created_at);

        const client = await pool.connect();
        try {
            await client.query(`
            INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                role = EXCLUDED.role,
                updated_at = NOW()
        `, [id, email, first_name, last_name, role, createdDate]);

            // 1.1 Insert Notification if New User
            if (eventType === 'user.created') {
                await client.query(
                    `INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, $3)`,
                    ['user', `משתמש חדש נרשם: ${first_name || ''} ${last_name || ''}`, false]
                );
            }

            // console.log(`Webhook processed: Synced user ${id} (${email})`);
        } catch (dbErr) {
            console.error("Webhook DB Error:", dbErr);
            return new NextResponse('DB Error', { status: 500 });
        } finally {
            client.release();
        }
    }

    return new NextResponse('', { status: 200 });
}
