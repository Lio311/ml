import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET() {
    const client = await pool.connect();
    try {
        await client.query(`
            ALTER TABLE products ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN DEFAULT false;
            CREATE TABLE IF NOT EXISTS preorders (
                id SERIAL PRIMARY KEY,
                product_id INT REFERENCES products(id) ON DELETE CASCADE,
                user_id VARCHAR(255),
                user_email VARCHAR(255),
                status VARCHAR(50) DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT NOW(),
                converted_at TIMESTAMP
            );
            CREATE INDEX IF NOT EXISTS idx_preorders_product_id ON preorders(product_id);
            CREATE INDEX IF NOT EXISTS idx_preorders_user_id ON preorders(user_id);
            CREATE INDEX IF NOT EXISTS idx_preorders_status ON preorders(status);
        `);
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: e.message }, { status: 500 });
    } finally {
        client.release();
    }
}
