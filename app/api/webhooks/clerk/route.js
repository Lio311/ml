
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { sendEmail, getTemplate, getAdminNewUserTemplate, getUserWelcomeTemplate } from '../../../lib/email';

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
    const body = await req.text();
    const payload = JSON.parse(body);

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
    console.log(`[Clerk Webhook] Received event: ${eventType}`);

    if (eventType === 'user.created' || eventType === 'user.updated') {
        const { id, email_addresses, first_name, last_name, public_metadata, created_at } = evt.data;
        const email = email_addresses?.[0]?.email_address || '';
        const role = public_metadata?.role || 'customer';
        console.log(`[Clerk Webhook] Processing user: ${email} (${eventType})`);

        // Clerk sends timestamps in ms
        const createdDate = new Date(created_at);

        const client = await pool.connect();
        try {
            await client.query(`
            INSERT INTO users (id, email, first_name, last_name, role, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
            ON CONFLICT (email) DO UPDATE SET
                id = EXCLUDED.id,
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

                // Send Admin Email Alert
                const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
                const adminTmpl = await getTemplate('admin_user_alert', 
                    { firstName: first_name, lastName: last_name, email: email, name: first_name },
                    () => getAdminNewUserTemplate({ first_name, last_name, email })
                );
                await sendEmail(adminEmail, adminTmpl.subject || 'משתמש חדש נרשם למערכת! ✨', adminTmpl.html, 'admin_alert');

                // Send Customer Welcome Email
                if (email) {
                    const welcomeTmpl = await getTemplate('welcome', 
                        { firstName: first_name, name: first_name },
                        () => getUserWelcomeTemplate(first_name)
                    );
                    await sendEmail(email, welcomeTmpl.subject || 'ברוכים הבאים ל-ml_tlv! ✨', welcomeTmpl.html, 'welcome');
                }
                console.log(`[Clerk Webhook] Successfully processed new user: ${email}`);
            } else {
                console.log(`[Clerk Webhook] Successfully updated user: ${email}`);
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
