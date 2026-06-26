import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { currentUser } from '@clerk/nextjs/server';

export async function GET() {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    if (role !== 'admin' && role !== 'deputy' && role !== 'viewer') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const res = await pool.query(`
            SELECT * FROM push_history 
            ORDER BY sent_at DESC 
            LIMIT 50
        `);
        return NextResponse.json(res.rows);
    } catch (error) {
        console.error('Push History Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

