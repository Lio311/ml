import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            // Create search_logs table
            await client.query(`
                CREATE TABLE IF NOT EXISTS search_logs (
                    id SERIAL PRIMARY KEY,
                    query TEXT NOT NULL,
                    results_count INTEGER DEFAULT 0,
                    user_id TEXT,
                    user_email TEXT,
                    ip_address TEXT,
                    user_agent TEXT,
                    platform TEXT,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Indexing for performance
            await client.query(`CREATE INDEX IF NOT EXISTS idx_search_logs_query ON search_logs(query);`);
            await client.query(`CREATE INDEX IF NOT EXISTS idx_search_logs_created ON search_logs(created_at);`);

            return NextResponse.json({ success: true, message: "Search logs table initialized." });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Setup Search DB Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
