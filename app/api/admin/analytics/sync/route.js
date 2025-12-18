import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const client = await pool.connect();
    try {
        // Sync the last 60 days
        const days = 60;

        // 1. Get daily orders and revenue
        const ordersRes = await client.query(`
            SELECT 
                DATE(created_at) as date,
                COUNT(*) as count,
                SUM(total_amount) as rev
            FROM orders
            WHERE status != 'cancelled'
            AND created_at >= CURRENT_DATE - INTERVAL '60 days'
            GROUP BY date
        `);

        // 2. Get daily visits (if table exists)
        let visitsRes = { rows: [] };
        try {
            visitsRes = await client.query(`
                SELECT 
                    DATE(created_at) as date,
                    COUNT(*) as count
                FROM site_visits
                WHERE created_at >= CURRENT_DATE - INTERVAL '60 days'
                GROUP BY date
            `);
        } catch (e) {
            console.warn("site_visits table not found during sync");
        }

        // 3. Upsert data into daily_stats
        const statsMap = new Map();

        ordersRes.rows.forEach(r => {
            const d = new Date(r.date).toISOString().split('T')[0];
            statsMap.set(d, { date: d, orders: r.count, revenue: r.rev, visits: 0 });
        });

        visitsRes.rows.forEach(r => {
            const d = new Date(r.date).toISOString().split('T')[0];
            const existing = statsMap.get(d) || { date: d, orders: 0, revenue: 0, visits: 0 };
            existing.visits = r.count;
            statsMap.set(d, existing);
        });

        for (const [date, data] of statsMap) {
            await client.query(`
                INSERT INTO daily_stats (stat_date, order_count, revenue, visit_count, updated_at)
                VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)
                ON CONFLICT (stat_date) DO UPDATE SET 
                    order_count = EXCLUDED.order_count,
                    revenue = EXCLUDED.revenue,
                    visit_count = EXCLUDED.visit_count,
                    updated_at = EXCLUDED.updated_at
            `, [date, data.orders, data.revenue, data.visits]);
        }

        return NextResponse.json({ success: true, synced: statsMap.size });
    } catch (error) {
        console.error("Sync failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
