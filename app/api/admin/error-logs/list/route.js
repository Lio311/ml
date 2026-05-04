import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import pool from "@/app/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses?.[0]?.emailAddress;
        const isSuperAdmin = email === process.env.ADMIN_EMAIL;

        if (!isSuperAdmin && role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            const result = await client.query(`
                SELECT * FROM error_logs 
                ORDER BY created_at DESC 
                LIMIT 200
            `);
            
            const statsResult = await client.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '24 hours') as last_24h,
                    COUNT(*) FILTER (WHERE created_at > NOW() - INTERVAL '7 days') as last_7d,
                    COUNT(DISTINCT endpoint) as unique_endpoints
                FROM error_logs
            `);
            
            const topEndpoints = await client.query(`
                SELECT endpoint, COUNT(*) as count, MAX(created_at) as last_error
                FROM error_logs
                WHERE created_at > NOW() - INTERVAL '7 days'
                GROUP BY endpoint
                ORDER BY count DESC
                LIMIT 10
            `);

            return NextResponse.json({
                errors: result.rows,
                stats: statsResult.rows[0] || { total: 0, last_24h: 0, last_7d: 0, unique_endpoints: 0 },
                topEndpoints: topEndpoints.rows
            });
        } finally {
            client.release();
        }
    } catch (error) {
        if (error?.code === '42P01') {
            return NextResponse.json({ errors: [], stats: { total: 0, last_24h: 0, last_7d: 0, unique_endpoints: 0 }, topEndpoints: [], tableExists: false });
        }
        console.error("Error logs list error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
