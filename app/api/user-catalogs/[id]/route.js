import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '../../../../lib/db';

export async function GET(req, { params }) {
    try {
        const { userId } = await auth();
        // Await the searchParams/params promise natively required in Next.js 15
        const { id } = await params;
        
        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            const res = await client.query('SELECT * FROM user_catalogs WHERE id = $1 AND user_id = $2', [id, userId]);
            if (res.rows.length === 0) {
                return NextResponse.json({ error: 'Catalog not found or unauthorized' }, { status: 404 });
            }
            return NextResponse.json(res.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching user catalog:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PUT(req, { params }) {
    try {
        const { userId } = await auth();
        const { id } = await params;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { name, description, contact_email, slug } = body;

        if (!name || !contact_email || !slug) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Validate slug format
        if (!/^[a-z0-9-]+$/.test(slug)) {
            return NextResponse.json({ error: 'Slug must contain only lowercase letters, numbers, and dashes' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            // Check ownership
            const check = await client.query('SELECT id FROM user_catalogs WHERE id = $1 AND user_id = $2', [id, userId]);
            if (check.rows.length === 0) {
                return NextResponse.json({ error: 'Catalog not found or unauthorized' }, { status: 404 });
            }

            // Check if slug is taken by ANOTHER catalog
            const slugCheck = await client.query('SELECT id FROM user_catalogs WHERE slug = $1 AND id != $2', [slug, id]);
            if (slugCheck.rows.length > 0) {
                return NextResponse.json({ error: 'Slug text already taken. Please choose another one.' }, { status: 409 });
            }

            const res = await client.query(
                `UPDATE user_catalogs SET name = $1, description = $2, contact_email = $3, slug = $4 
                 WHERE id = $5 AND user_id = $6 RETURNING *`,
                [name, description, contact_email, slug, id, userId]
            );

            return NextResponse.json(res.rows[0]);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error updating user catalog:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE(req, { params }) {
    try {
        const { userId } = await auth();
        const { id } = await params;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            // Check ownership and delete
            const res = await client.query('DELETE FROM user_catalogs WHERE id = $1 AND user_id = $2 RETURNING id', [id, userId]);
            
            if (res.rowCount === 0) {
                 return NextResponse.json({ error: 'Catalog not found or unauthorized' }, { status: 404 });
            }

            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error deleting user catalog:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
