import pool from '@/app/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(req, { params }) {
    try {
        const { id } = await params;

        // Admin Auth Check
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const adminEmail = user?.emailAddresses[0]?.emailAddress;
        
        if (role !== 'admin' && adminEmail !== process.env.ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch user emails
        const userRes = await pool.query(`SELECT email, secondary_email FROM users WHERE id = $1`, [id]);
        if (userRes.rows.length === 0) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { email, secondary_email } = userRes.rows[0];
        const emailsToSearch = [email];
        if (secondary_email) emailsToSearch.push(secondary_email);

        // Fetch email logs where recipient is like any of the emails (recipient can be a comma separated list)
        // We'll use a simpler OR condition with ILIKE
        const conditions = emailsToSearch.map((_, i) => `recipient ILIKE $${i + 1}`);
        const queryParams = emailsToSearch.map(e => `%${e}%`);

        const logsRes = await pool.query(
            `SELECT id, order_id, sent_at, campaign_id, status, error_message, recipient, subject, type 
             FROM email_logs 
             WHERE ${conditions.join(' OR ')}
             ORDER BY sent_at DESC
             LIMIT 50`,
            queryParams
        );

        return NextResponse.json({ logs: logsRes.rows });
    } catch (error) {
        console.error('Error fetching user email logs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
