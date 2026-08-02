import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

export async function GET() {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS queued_shabbat_emails (
                id SERIAL PRIMARY KEY,
                recipient TEXT NOT NULL,
                subject TEXT NOT NULL,
                html TEXT NOT NULL,
                type VARCHAR(100) DEFAULT 'system',
                order_id INT,
                campaign_id INT,
                attachments JSONB DEFAULT '[]',
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT NOW(),
                sent_at TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_queued_shabbat_status ON queued_shabbat_emails(status);
            CREATE INDEX IF NOT EXISTS idx_queued_shabbat_created ON queued_shabbat_emails(created_at);
        `);

        // Clean up any stale test records
        const deleted = await client.query(
            `DELETE FROM queued_shabbat_emails WHERE recipient = 'test@example.com' AND subject = 'Test Shabbat Queue' RETURNING id`
        );

        return NextResponse.json({ 
            success: true, 
            message: 'queued_shabbat_emails table created successfully',
            cleanedTestRecords: deleted.rowCount
        });
    } catch (e) {
        console.error('Migration error:', e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    } finally {
        client.release();
    }
}
