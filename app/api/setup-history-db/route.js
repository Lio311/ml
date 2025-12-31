import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

export async function GET() {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    try {
        const client = await pool.connect();
        try {
            // Create product_views table
            await client.query(`
                CREATE TABLE IF NOT EXISTS product_views (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT NOT NULL,
                    product_id TEXT NOT NULL,
                    viewed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Create index for faster querying by user and date
            await client.query(`
                CREATE INDEX IF NOT EXISTS idx_product_views_user_date 
                ON product_views(user_id, viewed_at);
            `);

            return NextResponse.json({
                success: true,
                message: 'History DB setup completed (product_views table created)'
            });
        } finally {
            client.release();
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
