import pool from "@/app/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
    const client = await pool.connect();
    try {
        // Create the daily_stats table if it doesn't exist
        await client.query(`
            CREATE TABLE IF NOT EXISTS daily_stats (
                id SERIAL PRIMARY KEY,
                stat_date DATE UNIQUE NOT NULL,
                order_count INT DEFAULT 0,
                revenue DECIMAL(10,2) DEFAULT 0,
                visit_count INT DEFAULT 0,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Index for performance
        await client.query(`CREATE INDEX IF NOT EXISTS idx_stat_date ON daily_stats(stat_date)`);

        return NextResponse.json({ success: true, message: "daily_stats table ready" });
    } catch (error) {
        console.error("Setup failed:", error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
