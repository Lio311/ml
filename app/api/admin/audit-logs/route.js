import pool from '../../../lib/db';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET(req) {
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        // Check if requester is admin
        const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        const role = adminCheck.rows[0]?.role;
        if (role !== 'admin') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = (page - 1) * limit;

        const logsQuery = `
            SELECT al.*, u.name as user_name
            FROM audit_logs al
            LEFT JOIN users u ON al.user_id = u.id
            ORDER BY al.created_at DESC
            LIMIT $1 OFFSET $2
        `;
        const countQuery = `SELECT COUNT(*) FROM audit_logs`;

        const [logsRes, countRes] = await Promise.all([
            pool.query(logsQuery, [limit, offset]),
            pool.query(countQuery)
        ]);

        return NextResponse.json({
            logs: logsRes.rows,
            total: parseInt(countRes.rows[0].count),
            page,
            totalPages: Math.ceil(parseInt(countRes.rows[0].count) / limit)
        });
    } catch (error) {
        console.error('Error fetching audit logs:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
