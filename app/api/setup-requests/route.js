
import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
    const client = await pool.connect();
    try {
        await client.query(`
            CREATE TABLE IF NOT EXISTS perfume_requests (
                id SERIAL PRIMARY KEY,
                user_email VARCHAR(255),
                brand VARCHAR(255) NOT NULL,
                model VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        return NextResponse.json({ success: true, message: 'Table created' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    } finally {
        client.release();
    }
}
