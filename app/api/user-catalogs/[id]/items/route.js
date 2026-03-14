import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '@/app/lib/db';

export async function GET(req, { params }) {
    try {
        // Here we might not strictly need auth for public viewing, but this endpoint is typically for the owner's dashboard
        // A separate public route will be created for public viewing by slug
        const { userId } = await auth();
        const { id } = await params;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            // Verify ownership first
            const ownerCheck = await client.query('SELECT id FROM user_catalogs WHERE id = $1 AND user_id = $2', [id, userId]);
            if (ownerCheck.rows.length === 0) {
                 return NextResponse.json({ error: 'Catalog not found or unauthorized' }, { status: 404 });
            }

            const res = await client.query('SELECT * FROM user_catalog_items WHERE catalog_id = $1 ORDER BY created_at DESC', [id]);
            return NextResponse.json(res.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching catalog items:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req, { params }) {
    try {
        const { userId } = await auth();
        const { id } = await params;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { 
            brand, 
            fragrance_name, 
            description, 
            prices, 
            image_url,
            top_notes,
            middle_notes,
            base_notes,
            gender,
            category
        } = body;

        if (!brand || !fragrance_name || !description || !prices || !image_url || !top_notes || !middle_notes || !base_notes || !gender || !category || Object.keys(prices).length === 0) {
            return NextResponse.json({ error: 'כל השדות הם חובה' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
             // Verify ownership
             const ownerCheck = await client.query('SELECT id FROM user_catalogs WHERE id = $1 AND user_id = $2', [id, userId]);
             if (ownerCheck.rows.length === 0) {
                  return NextResponse.json({ error: 'Catalog not found or unauthorized' }, { status: 404 });
             }

            const res = await client.query(
                `INSERT INTO user_catalog_items (
                    catalog_id, brand, fragrance_name, name, description, prices, image_url, 
                    top_notes, middle_notes, base_notes, gender, category
                ) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
                [id, brand, fragrance_name, `${brand} ${fragrance_name}`, description, JSON.stringify(prices), image_url, top_notes, middle_notes, base_notes, gender, category]
            );

            return NextResponse.json(res.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error adding catalog item:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
