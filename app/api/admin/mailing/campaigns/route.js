import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { currentUser } from '@clerk/nextjs/server';

export async function GET() {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    if (role !== 'admin' && role !== 'deputy') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    try {
        const res = await pool.query(`
            SELECT c.*, t.name as template_name 
            FROM email_campaigns c
            LEFT JOIN email_templates t ON c.template_id = t.id
            ORDER BY c.created_at DESC
        `);
        return NextResponse.json(res.rows);
    } catch (err) {
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
        const { id, template_id, title, subject, content_html, recipient_type, recipients, scheduled_at, status } = body;

        if (id) {
            // Update existing (only if not sent)
            const check = await pool.query('SELECT status FROM email_campaigns WHERE id = $1', [id]);
            if (check.rows[0]?.status === 'sent') {
                return NextResponse.json({ error: 'Cannot edit an already sent campaign' }, { status: 400 });
            }

            const res = await pool.query(`
                UPDATE email_campaigns 
                SET template_id = $1, title = $2, subject = $3, content_html = $4, 
                    recipient_type = $5, recipients = $6, scheduled_at = $7, status = $8, updated_at = NOW()
                WHERE id = $9
                RETURNING *
            `, [template_id, title, subject, content_html, recipient_type, recipients, scheduled_at, status || 'scheduled', id]);
            return NextResponse.json(res.rows[0]);
        } else {
            // Create New
            const res = await pool.query(`
                INSERT INTO email_campaigns (template_id, title, subject, content_html, recipient_type, recipients, scheduled_at, status)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
                RETURNING *
            `, [template_id, title, subject, content_html, recipient_type, recipients, scheduled_at, status || 'scheduled']);
            return NextResponse.json(res.rows[0]);
        }
    } catch (err) {
        console.error('Error saving campaign:', err);
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
        await pool.query('DELETE FROM email_campaigns WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
