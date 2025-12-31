import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { checkAdmin } from '../../lib/admin';

export async function GET() {
    const isAdmin = await checkAdmin();
    if (!isAdmin) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }
    try {
        const client = await pool.connect();

        await client.query(`
        CREATE TABLE IF NOT EXISTS reviews (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
            rating INTEGER CHECK (rating >= 1 AND rating <= 5),
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, product_id)
        );
    `);

        await client.query(`
        CREATE TABLE IF NOT EXISTS wishlist (
            id SERIAL PRIMARY KEY,
            user_id TEXT NOT NULL,
            product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(user_id, product_id)
        );
    `);

        client.release();
        return NextResponse.json({ success: true, message: "Tables created" });
    } catch (error) {
        console.error("Setup Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
