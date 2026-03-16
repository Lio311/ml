import pool from '../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        const client = await pool.connect();
        
        await client.query(`
            CREATE TABLE IF NOT EXISTS conversations (
                id SERIAL PRIMARY KEY,
                participant1_id VARCHAR(255) NOT NULL,
                participant2_id VARCHAR(255) NOT NULL,
                catalog_id INTEGER REFERENCES catalogs(id) ON DELETE CASCADE,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        await client.query(`
            CREATE TABLE IF NOT EXISTS messages (
                id SERIAL PRIMARY KEY,
                conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE,
                sender_id VARCHAR(255) NOT NULL,
                content TEXT NOT NULL,
                is_read BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);
        
        client.release();
        return NextResponse.json({ success: true, message: 'Chat tables created successfully' });
    } catch (error) {
        console.error('Failed to create chat tables:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
