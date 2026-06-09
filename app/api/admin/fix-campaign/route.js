import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET() {
    await pool.query("UPDATE email_campaigns SET status='sent', sent_at=NOW() WHERE status='sending'");
    return NextResponse.json({ success: true });
}
