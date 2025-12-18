import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        await client.query(`
            ALTER TABLE products 
            ADD COLUMN IF NOT EXISTS name_he TEXT;
        `);
        client.release();
        return NextResponse.json({ message: "Migration successful: Added name_he column" });
    } catch (error) {
        console.error("Migration failed:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
