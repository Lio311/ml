import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { sendEmail } from '@/app/lib/email';
import { checkCronOrAdmin } from "@/app/lib/admin";

export async function GET(req) {
    const isAuthorized = await checkCronOrAdmin(req);
    if (!isAuthorized) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        
        // Select all pending emails, locking them for update so concurrent crons don't double send
        const res = await client.query(`
            SELECT * 
            FROM queued_shabbat_emails 
            WHERE status = 'pending'
            FOR UPDATE SKIP LOCKED
        `);

        let processedCount = 0;

        for (const row of res.rows) {
            const { id, recipient, subject, html, type, order_id, campaign_id, attachments } = row;
            
            try {
                // Determine if recipient is an array string
                let parsedRecipient = recipient;
                if (recipient.startsWith('[')) {
                    parsedRecipient = JSON.parse(recipient);
                }

                let parsedAttachments = [];
                if (attachments) {
                    parsedAttachments = typeof attachments === 'string' ? JSON.parse(attachments) : attachments;
                }

                // Actually send the email (temporarily disable Shabbat check for this specific call? 
                // Wait, if this cron runs during Shabbat for some reason, it shouldn't re-queue it. 
                // But this cron runs on Sunday so it's fine).
                await sendEmail(parsedRecipient, subject, html, type, order_id, campaign_id, parsedAttachments, true);

                await client.query('UPDATE queued_shabbat_emails SET status = $1 WHERE id = $2', ['sent', id]);
                processedCount++;
            } catch (e) {
                console.error(`Error sending shabbat email ${id}:`, e);
                await client.query('UPDATE queued_shabbat_emails SET status = $1 WHERE id = $2', ['failed', id]);
            }
        }

        await client.query('COMMIT');
        
        return NextResponse.json({ success: true, processedCount });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error('Error processing shabbat emails:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
