import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { recordAuditLog } from '../../../lib/audit';
import { auth as clerkAuth } from '@clerk/nextjs/server';


export async function GET() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT id, name, logo_url, created_at, title, description, perfumer, highlights, title_en, description_en, highlights_en, perfumer_en FROM brands ORDER BY name ASC');
        client.release();
        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching brands:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const body = await req.json();
        const { id, logo_url } = body;

        const client = await pool.connect();
        await client.query('UPDATE brands SET logo_url = $1 WHERE id = $2', [logo_url, id]);
        client.release();

        const authData = await clerkAuth();
        await recordAuditLog({
            userId: authData?.userId,
            action: 'update_brand',
            entityType: 'brand',
            entityId: String(id),
            details: body,
            req
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating brand:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
