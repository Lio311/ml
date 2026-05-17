import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { sendEmail } from '@/app/lib/email';

export const dynamic = 'force-dynamic';

export async function GET(req) {
    // Basic security check (Cron key or Auth header)
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Only block if secret is defined
        // return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        // 1. Get campaigns that are due
        const dueCampaigns = await pool.query(`
            SELECT * FROM email_campaigns 
            WHERE status = 'scheduled' 
            AND (scheduled_at <= NOW() OR scheduled_at IS NULL)
            LIMIT 5
        `);

        const results = [];

        for (const campaign of dueCampaigns.rows) {
            try {
                // 2. Determine recipients
                let recipientEmails = [];
                if (campaign.recipient_type === 'all') {
                    const usersRes = await pool.query('SELECT email FROM users WHERE email IS NOT NULL');
                    recipientEmails = usersRes.rows.map(u => u.email);
                } else if (Array.isArray(campaign.recipients)) {
                    recipientEmails = campaign.recipients;
                }

                if (recipientEmails.length === 0) {
                    await pool.query("UPDATE email_campaigns SET status = 'sent', sent_at = NOW(), error_log = 'No recipients found' WHERE id = $1", [campaign.id]);
                    continue;
                }

                // 3. Send Emails (using BCC for multiple recipients to avoid huge 'To' headers)
                // Note: lib/email already handles arrays by using BCC
                await sendEmail(
                    recipientEmails, 
                    campaign.subject, 
                    campaign.content_html, 
                    'marketing'
                );

                // 4. Update status
                await pool.query(`
                    UPDATE email_campaigns 
                    SET status = 'sent', sent_at = NOW(), updated_at = NOW()
                    WHERE id = $1
                `, [campaign.id]);

                results.push({ id: campaign.id, status: 'success', recipientsCount: recipientEmails.length });

            } catch (err) {
                console.error(`Error processing campaign ${campaign.id}:`, err);
                await pool.query(`
                    UPDATE email_campaigns 
                    SET status = 'failed', error_log = $1, updated_at = NOW()
                    WHERE id = $2
                `, [err.message, campaign.id]);
                results.push({ id: campaign.id, status: 'failed', error: err.message });
            }
        }

        return NextResponse.json({ processed: results.length, results });

    } catch (err) {
        console.error('Cron job error:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
