
import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import pool from '../../lib/db';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            const res = await client.query('SELECT phone FROM users WHERE id = $1', [userId]);
            if (res.rows.length === 0) {
                return NextResponse.json({ phone: '' });
            }
            return NextResponse.json({ phone: res.rows[0].phone || '' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Failed to fetch user phone:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
