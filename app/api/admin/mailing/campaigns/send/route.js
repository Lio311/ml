import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { sendEmail } from '@/app/lib/email';

export async function POST(req) {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    if (role !== 'admin' && role !== 'deputy') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { campaignId } = await req.json();
        if (!campaignId) return NextResponse.json({ error: 'Missing campaignId' }, { status: 400 });

        // 1. Fetch Campaign
        const campaignRes = await pool.query('SELECT * FROM email_campaigns WHERE id = $1', [campaignId]);
        const campaign = campaignRes.rows[0];
        if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
        if (campaign.status === 'sent') return NextResponse.json({ error: 'Campaign already sent' }, { status: 400 });

        // 2. Identify Recipients
        let recipientData = [];
        if (campaign.recipient_type === 'all') {
            const usersRes = await pool.query('SELECT email, first_name, last_name FROM users WHERE email IS NOT NULL');
            recipientData = usersRes.rows.map(u => ({ email: u.email, first_name: u.first_name, last_name: u.last_name }));
        } else {
            // recipients is stored as JSONB array of objects [{id: '...', label: '...', subLabel: 'email@...'}]
            const emails = (campaign.recipients || []).map(r => typeof r === 'string' ? r : (r.subLabel || r.id));
            if (emails.length > 0) {
                const placeholders = emails.map((_, i) => `$${i + 1}`).join(',');
                const usersRes = await pool.query(`SELECT email, first_name, last_name FROM users WHERE email IN (${placeholders})`, emails);
                const userMap = {};
                usersRes.rows.forEach(u => userMap[u.email] = u);
                
                recipientData = emails.map(email => ({
                    email,
                    first_name: userMap[email]?.first_name || '',
                    last_name: userMap[email]?.last_name || ''
                }));
            }
        }

        if (recipientData.length === 0) {
            return NextResponse.json({ error: 'No recipients found for this campaign' }, { status: 400 });
        }

        // 3. Update status to 'sending'
        await pool.query('UPDATE email_campaigns SET status = $1 WHERE id = $2', ['sending', campaignId]);

        // 4. Send Emails (Loop)
        let successCount = 0;
        let failCount = 0;
        let lastError = null;

        for (const data of recipientData) {
            try {
                const displayName = data.first_name ? data.first_name : 'לקוח/ה יקר/ה';
                const personalizedHtml = (campaign.content_html || '').replace(/\{\{name\}\}/g, displayName);
                const personalizedSubject = (campaign.subject || '').replace(/\{\{name\}\}/g, displayName);

                await sendEmail(data.email, personalizedSubject, personalizedHtml, 'campaign', null, campaignId);
                successCount++;
            } catch (err) {
                console.error(`Failed to send campaign email to ${data.email}:`, err);
                failCount++;
                lastError = err.message;
            }
        }

        // 5. Finalize status
        const finalStatus = failCount === recipientData.length ? 'failed' : 'sent';
        await pool.query(`
            UPDATE email_campaigns 
            SET status = $1, sent_at = NOW(), error_log = $2, updated_at = NOW() 
            WHERE id = $3
        `, [finalStatus, lastError, campaignId]);

        return NextResponse.json({ 
            success: true, 
            status: finalStatus, 
            sent: successCount, 
            failed: failCount 
        });

    } catch (err) {
        console.error('Error in campaign send API:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
