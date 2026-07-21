import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import pool from '../../../lib/db';

export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            const res = await client.query('SELECT preferences FROM users WHERE id = $1', [userId]);
            if (res.rows.length === 0) {
                return NextResponse.json({ preferences: {} });
            }
            return NextResponse.json({ preferences: res.rows[0].preferences || {} });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error fetching user preferences:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const preferencesToUpdate = body.preferences;

        if (!preferencesToUpdate || typeof preferencesToUpdate !== 'object') {
             return NextResponse.json({ error: 'Invalid preferences format' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // Update preferences by merging with existing JSONB
            await client.query(`
                UPDATE users 
                SET preferences = COALESCE(preferences, '{}'::jsonb) || $1::jsonb
                WHERE id = $2
            `, [JSON.stringify(preferencesToUpdate), userId]);
            
            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Error updating user preferences:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
