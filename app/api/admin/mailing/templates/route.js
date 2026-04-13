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

        -- Seed system templates if they don't exist
        INSERT INTO email_templates (slug, name, type)
        VALUES 
            ('order_confirmation', 'אישור הזמנה (מערכת)', 'system'),
            ('status_update', 'עדכון סטטוס הזמנה (מערכת)', 'system'),
            ('welcome', 'ברוכים הבאים (מערכת)', 'system'),
            ('back_in_stock', 'חזרה למלאי (מערכת)', 'system'),
            ('review_request', 'בקשת חוות דעת (מערכת)', 'system'),
            ('cart_recovery', 'שחזור סל נטוש (מערכת)', 'system'),
            ('recommendations', 'המלצות אישיות (מערכת)', 'system'),
            ('educational', 'מייל לימודי/טיפים (מערכת)', 'system'),
            ('admin_order_alert', 'התראת הזמנה חדשה (ניהול)', 'system'),
            ('admin_user_alert', 'התראת משתמש חדש (ניהול)', 'system'),
            ('contact_form_alert', 'פנייה מצור קשר (ניהול)', 'system')
        ON CONFLICT (slug) DO NOTHING;
    `);

    // Ensure system templates have content (Auto-fix for first migration)
    const defaults = getSystemDefaults();
    for (const [slug, data] of Object.entries(defaults)) {
        await pool.query(`
            UPDATE email_templates 
            SET content_html = $1, subject = $2
            WHERE slug = $3 AND (content_html IS NULL OR content_html = '')
        `, [data.content_html, data.subject, slug]);
    }
}

export async function GET() {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    if (role !== 'admin' && role !== 'deputy') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        await ensureTables();
        const res = await pool.query('SELECT * FROM email_templates ORDER BY type DESC, name ASC');
        const systemDefaults = getSystemDefaults();
        
        const rows = res.rows.map(row => {
            if (row.type === 'system' && !row.content_html && systemDefaults[row.slug]) {
                return {
                    ...row,
                    subject: row.subject || systemDefaults[row.slug].subject,
                    content_html: systemDefaults[row.slug].content_html
                };
            }
            return row;
        });

        return NextResponse.json(rows);
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
                SET name = $1, subject = $2, content_html = $3, is_active = $4, updated_at = NOW()
                WHERE id = $5
                RETURNING *
            `, [name, subject, content_html, is_active, id]);
            return NextResponse.json(res.rows[0]);
        } else {
            // Create
            const res = await pool.query(`
                INSERT INTO email_templates (name, slug, subject, content_html, type, is_active)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *
            `, [name, slug || null, subject, content_html, type || 'manual', is_active !== false]);
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
