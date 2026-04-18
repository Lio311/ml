import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function GET(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            // Lazy migration check
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

            // 1. Top Queries (General)
            const topQueriesRes = await client.query(`
                SELECT query, COUNT(*) as count, AVG(results_count) as avg_results
                FROM search_logs
                GROUP BY query
                ORDER BY count DESC
                LIMIT 20
            `);

            // 2. Zero Result Queries (The Gaps)
            const zeroResultsRes = await client.query(`
                SELECT query, COUNT(*) as count
                FROM search_logs
                WHERE results_count = 0
                GROUP BY query
                ORDER BY count DESC
                LIMIT 20
            `);

            // 3. Recent Searches with User Context
            const recentSearchesRes = await client.query(`
                SELECT * FROM search_logs 
                ORDER BY created_at DESC 
                LIMIT 50
            `);

            // 4. Volume Trend (Daily)
            const trendRes = await client.query(`
                SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
                FROM search_logs
                WHERE created_at > NOW() - INTERVAL '30 days'
                GROUP BY date
                ORDER BY date ASC
            `);

            // 5. Totals
            const totalsRes = await client.query(`
                SELECT 
                    COUNT(*) as total_searches,
                    COUNT(DISTINCT query) as unique_queries,
                    COUNT(*) FILTER (WHERE results_count = 0) as zero_result_searches
                FROM search_logs
            `);

            return NextResponse.json({
                topQueries: topQueriesRes.rows,
                zeroResults: zeroResultsRes.rows,
                recentSearches: recentSearchesRes.rows,
                trend: trendRes.rows,
                totals: totalsRes.rows[0]
            });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Search Analytics Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
