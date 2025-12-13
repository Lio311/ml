import { NextResponse } from 'next/server';
import { Pool } from 'pg';

const pool = new Pool({
    connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL,
    ssl: { rejectUnauthorized: false }
});

export async function GET() {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM brands ORDER BY name ASC');
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

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error updating brand:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
