import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { getSystemDefaults } from '@/app/lib/email';

export async function GET() {
    try {
        const defaults = getSystemDefaults();
        
        // Update new_perfumes_batch
        if (defaults['new_perfumes_batch']) {
            await pool.query(
                `UPDATE email_templates SET content_html = $1, subject = $2 WHERE slug = 'new_perfumes_batch'`,
                [defaults['new_perfumes_batch'].content_html, defaults['new_perfumes_batch'].subject]
            );
        }
        
        // Update new_discovery_sets
        if (defaults['new_discovery_sets']) {
            await pool.query(
                `UPDATE email_templates SET content_html = $1, subject = $2 WHERE slug = 'new_discovery_sets'`,
                [defaults['new_discovery_sets'].content_html, defaults['new_discovery_sets'].subject]
            );
        }

        return NextResponse.json({ success: true, message: "Templates synchronized in database" });
    } catch (err) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
