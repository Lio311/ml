import pool from '../../lib/db';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import AuditLogsClient from './AuditLogsClient';
import { cookies } from 'next/headers';

import { getBrandName } from '../../lib/brand';

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    return {
        title: locale === 'he' ? "יומן פעולות Admin" : "Audit Logs Admin",
        robots: "noindex, nofollow",
    };
}

export default async function AuditLogsPage({ searchParams }) {
    const params = await searchParams;
    const authData = await clerkAuth();
    const userId = authData?.userId;
    if (!userId) redirect('/sign-in');

    const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
    const role = adminCheck.rows[0]?.role;
    if (role !== 'admin' && role !== 'viewer') {
        redirect('/admin');
    }

    const page = parseInt(params.page || '1');
    const limit = 7;
    const offset = (page - 1) * limit;

    const logsRes = await pool.query(`
        SELECT al.id, al.user_id, al.action, al.entity_type, al.entity_id, al.details, al.created_at,
               CONCAT(u.first_name, ' ', u.last_name) as user_name, u.image_url
        FROM audit_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ORDER BY al.created_at DESC
        LIMIT $1 OFFSET $2
    `, [limit, offset]);

    const formattedLogs = logsRes.rows.map(log => ({
        ...log,
        created_at: log.created_at.toISOString() // Stable ISO string for hydration
    }));

    const countRes = await pool.query('SELECT COUNT(*) FROM audit_logs');
    const totalCount = parseInt(countRes.rows[0].count);

    return (
        <div className="p-4 md:p-6 max-w-7xl mx-auto">
            <h1 className="text-2xl md:text-3xl font-bold mb-8 text-right">יומן פעולות</h1>
            <AuditLogsClient 
                initialLogs={formattedLogs} 
                totalCount={totalCount} 
                currentPage={page} 
                limit={limit}
            />
        </div>
    );
}
