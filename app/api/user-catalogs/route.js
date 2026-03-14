import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '@/app/lib/db';

// Get all catalogs for current user
export async function GET() {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            const res = await client.query('SELECT * FROM user_catalogs WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
            return NextResponse.json(res.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching user catalogs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

// Create a new catalog
export async function POST(req) {
    try {
        const { userId } = await auth();
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, description, contact_email, slug, image_url } = body;

        if (!name || !contact_email || !slug) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate slug format (letters, numbers, dashes only)
        if (!/^[a-z0-9-]+$/.test(slug)) {
            return NextResponse.json({ error: 'Slug must contain only lowercase letters, numbers, and dashes' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // Check if slug exists
            const slugCheck = await client.query('SELECT id FROM user_catalogs WHERE slug = $1', [slug]);
            if (slugCheck.rows.length > 0) {
                return NextResponse.json({ error: 'Slug text already taken. Please choose another one.' }, { status: 409 });
            }

            const res = await client.query(
                `INSERT INTO user_catalogs (user_id, slug, name, description, contact_email, image_url) 
                 VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
                [userId, slug, name, description, contact_email, image_url || null]
            );

            return NextResponse.json(res.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error creating user catalog:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
