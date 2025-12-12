import { NextResponse } from 'next/server';
import pool from '../../lib/db';

export async function GET() {
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
