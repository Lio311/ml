import pool from '@/app/lib/db';
import { NextResponse } from 'next/server';

export async function POST() {
    let client;
    try {
        client = await pool.connect();
        await client.query("UPDATE notifications SET is_read = TRUE WHERE is_read = FALSE");
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}
