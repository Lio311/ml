import pool from '../../../../lib/db';
import { NextResponse } from 'next/server';

export async function GET() {
    try {
        await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS address JSONB;`);
        return NextResponse.json({ success: true });
    } catch(err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
