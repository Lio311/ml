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
        await client.query('BEGIN');

        // Create influencers table
        await client.query(`
            CREATE TABLE IF NOT EXISTS influencers (
                id SERIAL PRIMARY KEY,
                name TEXT UNIQUE NOT NULL,
                base_salary NUMERIC DEFAULT 0,
                commission_percent NUMERIC DEFAULT 10,
                created_at TIMESTAMP DEFAULT NOW()
            );
        `);

        // Add influencer_id to coupons
        await client.query(`
            DO $$ 
            BEGIN 
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='influencer_id') THEN
                    ALTER TABLE coupons ADD COLUMN influencer_id INTEGER REFERENCES influencers(id) ON DELETE SET NULL;
                END IF;
            END $$;
        `);

        await client.query('COMMIT');
        return NextResponse.json({ success: true, message: "Influencer tables and columns initialized" });
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Setup Influencers Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
