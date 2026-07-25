import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { currentUser } from '@clerk/nextjs/server';
import { getSystemDefaults } from '@/app/lib/email';

// Helper to ensure tables exist (Lazy migration)
async function ensureTables() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS email_templates (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            slug TEXT UNIQUE,
            subject TEXT,
            content_html TEXT,
            type TEXT DEFAULT 'manual',
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS email_campaigns (
            id SERIAL PRIMARY KEY,
            template_id INTEGER REFERENCES email_templates(id) ON DELETE SET NULL,
            title TEXT,
            subject TEXT,
            content_html TEXT,
            recipient_type TEXT DEFAULT 'all',
            recipients JSONB,
            status TEXT DEFAULT 'scheduled',
            scheduled_at TIMESTAMP WITH TIME ZONE,
            sent_at TIMESTAMP WITH TIME ZONE,
            error_log TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    `);

    // Ensure system templates exist in the database (DO NOT overwrite existing ones on every GET)
    const defaults = getSystemDefaults();
    for (const [slug, data] of Object.entries(defaults)) {
        await pool.query(`
            INSERT INTO email_templates (slug, name, type, content_html, subject)
            VALUES ($1, $2, 'system', $3, $4)
            ON CONFLICT (slug) DO NOTHING
        `, [slug, data.name || slug, data.content_html, data.subject]);
    }
}

export async function GET(req) {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    if (role !== 'admin' && role !== 'deputy' && role !== 'viewer') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const isDefaultRequest = searchParams.get('default') === 'true';
    const slug = searchParams.get('slug');

    if (isDefaultRequest && slug) {
        const defaults = getSystemDefaults();
        const template = defaults[slug];
        if (!template) {
            return NextResponse.json({ error: 'System default not found for this slug' }, { status: 404 });
        }
        return NextResponse.json(template);
    }

    try {
        await ensureTables();
        const res = await pool.query('SELECT * FROM email_templates ORDER BY type DESC, name ASC');
        return NextResponse.json(res.rows);
    } catch (err) {
        console.error('Error fetching templates:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req) {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    if (role !== 'admin' && role !== 'deputy') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const { id, name, slug, subject, content_html, type, is_active } = body;

        if (id) {
            // Update
            const res = await pool.query(`
                UPDATE email_templates 
                SET name = $1, subject = $2, content_html = $3, 
                    type = $4, is_active = $5, updated_at = NOW()
                WHERE id = $6
                RETURNING *
            `, [name, subject, content_html, type || 'manual', is_active !== false, id]);
            return NextResponse.json(res.rows[0]);
        } else {
            // Create New
            const res = await pool.query(`
                INSERT INTO email_templates (name, subject, content_html, type, is_active, slug)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [name, subject, content_html, type || 'manual', is_active !== false, slug || `custom_${Date.now()}`]);
            return NextResponse.json(res.rows[0]);
        }
    } catch (err) {
        console.error('Error saving template:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req) {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    if (role !== 'admin' && role !== 'deputy') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        // Prevent deleting system templates
        const check = await pool.query('SELECT type FROM email_templates WHERE id = $1', [id]);
        if (check.rows[0]?.type === 'system') {
            return NextResponse.json({ error: 'Cannot delete system templates' }, { status: 400 });
        }

        await pool.query('DELETE FROM email_templates WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (err) {
        console.error('Error deleting template:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

