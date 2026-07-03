import pool from '../../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    const client = await pool.connect();
    try {
        const res = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        return NextResponse.json(res.rows);
    } finally {
        client.release();
    }
}
