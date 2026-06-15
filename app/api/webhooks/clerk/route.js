
import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { sendEmail, getTemplate, getAdminNewUserTemplate, getUserWelcomeTemplate } from '../../../lib/email';
import { isAutomationActive } from '../../../lib/automationConfig';

export async function POST(req) {
    const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

    if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env or .env.local');
    }

    const headerPayload = await headers();
    const svix_id = headerPayload.get("svix-id");
    const svix_timestamp = headerPayload.get("svix-timestamp");
    const svix_signature = headerPayload.get("svix-signature");

    if (!svix_id || !svix_timestamp || !svix_signature) {
        return new NextResponse('Error occured -- no svix headers', {
            status: 400
        });
    }

    const body = await req.text();
    const payload = JSON.parse(body);

    const wh = new Webhook(WEBHOOK_SECRET);

    let evt;

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

    const eventType = evt.type;
    console.log(`[Clerk Webhook] Received event: ${eventType}`);

    if (eventType === 'user.created' || eventType === 'user.updated') {
        const { id, email_addresses, first_name, last_name, public_metadata, created_at, image_url, profile_image_url } = evt.data;
        const imageUrl = image_url || profile_image_url || '';
        const email = email_addresses?.[0]?.email_address || '';
        const role = public_metadata?.role || 'customer';
        console.log(`[Clerk Webhook] Processing user: ${email} (${eventType})`);

        const createdDate = new Date(created_at);

        const client = await pool.connect();
        try {
            await client.query(`
            INSERT INTO users (id, email, first_name, last_name, role, image_url, created_at, updated_at, last_active_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
            ON CONFLICT (email) DO UPDATE SET
                id = EXCLUDED.id,
                first_name = EXCLUDED.first_name,
                last_name = EXCLUDED.last_name,
                role = EXCLUDED.role,
                image_url = EXCLUDED.image_url,
                updated_at = NOW(),
                last_active_at = NOW()
        `, [id, email, first_name, last_name, role, imageUrl, createdDate]);

            if (eventType === 'user.created') {
                await client.query(
                    `INSERT INTO notifications (type, message, is_read) VALUES ($1, $2, $3)`,
                    ['user', `משתמש חדש נרשם: ${first_name || ''} ${last_name || ''}`, false]
                );

                const adminActive = await isAutomationActive('התראת נרשם חדש (למנהל)');
                if (adminActive) {
                    const adminEmail = process.env.ADMIN_EMAIL || process.env.GMAIL_USER;
                    const adminTmpl = await getTemplate('admin_user_alert', 
                        { firstName: first_name, lastName: last_name, email: email, name: first_name },
                        () => getAdminNewUserTemplate({ first_name, last_name, email })
                    );
                    await sendEmail(adminEmail, adminTmpl.subject || 'משתמש חדש נרשם למערכת! ✨', adminTmpl.html, 'admin_alert');
                }

                const welcomeActive = await isAutomationActive('מייל ברוכים הבאים (למשתמש חדש)');
                if (email && welcomeActive) {
                    const welcomeTmpl = await getTemplate('welcome', 
                        { firstName: first_name, name: first_name },
                        () => getUserWelcomeTemplate(first_name)
                    );
                    await sendEmail(email, welcomeTmpl.subject || 'ברוכים הבאים ל-ml_tlv! ✨', welcomeTmpl.html, 'welcome');
                }
                // Update visual workflows last_run
                await client.query(`
                    UPDATE workflows 
                    SET last_run = NOW(), total_runs = total_runs + 1
                    WHERE name IN ('התראת נרשם חדש (למנהל)', 'מייל ברוכים הבאים (למשתמש חדש)')
                `);
                console.log(`[Clerk Webhook] Successfully processed new user: ${email}`);
            } else {
                console.log(`[Clerk Webhook] Successfully updated user: ${email}`);
            }
        } catch (dbErr) {
            console.error("Webhook DB Error:", dbErr);
            return new NextResponse('DB Error', { status: 500 });
        } finally {
            client.release();
        }
    }

    return new NextResponse('', { status: 200 });
}
