import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            const result = await client.query('SELECT * FROM search_mappings ORDER BY created_at DESC');
            return NextResponse.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const { hebrew, english, type } = await req.json();
        if (!hebrew || !english) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        const client = await pool.connect();
        try {
            // Upsert (if term exists, update?)
            // Or simple insert.
            const result = await client.query(
                `INSERT INTO search_mappings (hebrew_term, english_term, type) 
                 VALUES ($1, $2, $3) 
                 ON CONFLICT (hebrew_term) DO UPDATE SET english_term = $2, type = $3
                 RETURNING *`,
                [hebrew, english, type || 'general']
            );
            return NextResponse.json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(req) {
    try {
        const { id, hebrew, english, type } = await req.json();
        if (!id || !hebrew || !english) return NextResponse.json({ error: "Missing fields" }, { status: 400 });

        const client = await pool.connect();
        try {
            const result = await client.query(
                `UPDATE search_mappings 
                 SET hebrew_term = $1, english_term = $2, type = $3 
                 WHERE id = $4 
                 RETURNING *`,
                [hebrew, english, type || 'general', id]
            );

            if (result.rowCount === 0) {
                return NextResponse.json({ error: "Item not found" }, { status: 404 });
            }

            return NextResponse.json(result.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const { id } = await req.json();
        if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

        const client = await pool.connect();
        try {
            await client.query('DELETE FROM search_mappings WHERE id = $1', [id]);
            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
