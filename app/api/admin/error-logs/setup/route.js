import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import pool from "@/app/lib/db";

export const dynamic = 'force-dynamic';

export async function POST() {
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
            await client.query(`
                CREATE TABLE IF NOT EXISTS error_logs (
                    id SERIAL PRIMARY KEY,
                    endpoint TEXT NOT NULL,
                    error_message TEXT,
                    error_stack TEXT,
                    status_code INTEGER,
                    request_method TEXT,
                    request_body TEXT,
                    user_agent TEXT,
                    ip_address TEXT,
                    created_at TIMESTAMP DEFAULT NOW()
                )
            `);

            await client.query(`
                CREATE TABLE IF NOT EXISTS cron_logs (
                    id SERIAL PRIMARY KEY,
                    cron_name TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'running',
                    message TEXT,
                    duration_ms INTEGER,
                    started_at TIMESTAMP DEFAULT NOW(),
                    finished_at TIMESTAMP
                )
            `);

            // Add index for faster queries
            await client.query(`CREATE INDEX IF NOT EXISTS idx_error_logs_created_at ON error_logs(created_at DESC)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_error_logs_endpoint ON error_logs(endpoint)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_cron_logs_cron_name ON cron_logs(cron_name)`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_cron_logs_started_at ON cron_logs(started_at DESC)`);

            return NextResponse.json({ success: true, message: 'Tables created successfully' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Setup error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
