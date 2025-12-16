import { NextResponse } from 'next/server';
import pool from '../../lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            await client.query(`
                ALTER TABLE orders 
                ADD COLUMN IF NOT EXISTS notes TEXT;
            `);
            return NextResponse.json({ success: true, message: "Added 'notes' column to orders table" });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Migration failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
