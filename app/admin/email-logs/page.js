import { auth } from '@clerk/nextjs/server';
import pool from '@/app/lib/db';
import { redirect } from 'next/navigation';
import EmailLogsClient from './EmailLogsClient';

export const metadata = {
    title: "יומן מיילים Admin",
    robots: "noindex, nofollow",
};

export default async function EmailLogsPage({ searchParams }) {
    const { userId } = await auth();
    if (!userId) redirect('/sign-in');

    const userRes = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    const role = userRes.rows[0]?.role;

    if (role !== 'admin' && role !== 'viewer') {
        redirect('/admin');
    }

    const resolvedParams = await searchParams;
    const page = parseInt(resolvedParams.page) || 1;
    const limit = 6;
    const offset = (page - 1) * limit;

    // Run one-time migration to ensure historical data is correct
    try {
        await pool.query('ALTER TABLE email_logs ADD COLUMN IF NOT EXISTS campaign_id INTEGER');
        await pool.query(`
            UPDATE email_logs 
            SET campaign_id = order_id, order_id = NULL 
            WHERE type = 'campaign' AND order_id IS NOT NULL AND campaign_id IS NULL
        `);
    } catch (e) {
        console.error('Migration failed:', e);
    }

    // Fetch logs
    const logsRes = await pool.query(`
        SELECT email_logs.*, users.image_url 
        FROM email_logs 
        LEFT JOIN users ON email_logs.recipient = users.email
        WHERE email_logs.status != 'processing'
        ORDER BY sent_at DESC 
        LIMIT $1 OFFSET $2
    `, [limit, offset]);

    // Fetch total count for pagination
    const countRes = await pool.query("SELECT COUNT(*) FROM email_logs WHERE status != 'processing'");
    const totalCount = parseInt(countRes.rows[0].count);
    const totalPages = Math.ceil(totalCount / limit);

    return (
        <div className="p-4 md:p-8" dir="rtl">
            <div className="max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">יומן מיילים</h1>
                        <p className="text-gray-500 mt-1">מעקב אחר כל התכתובות שנשלחו מהמערכת ללקוחות.</p>
                    </div>
                </div>

                <EmailLogsClient 
                    initialLogs={logsRes.rows} 
                    currentPage={page} 
                    totalPages={totalPages}
                    totalCount={totalCount}
                />
            </div>
        </div>
    );
}
