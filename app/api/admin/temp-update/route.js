import { NextResponse } from 'next/server';
import pool from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const client = await pool.connect();
    try {
        const slugs = ['bergamoss-lets-make-love-on-christmas', 'bergamoss-nettarina-frizzante', 'bergamoss-mango-sticky-rice'];
        const res = await client.query('UPDATE products SET concentration = $1 WHERE slug = ANY($2) RETURNING id, name, concentration', ['Parfum', slugs]);

        return NextResponse.json({ success: true, updated: res.rows });
    } catch (error) {
        return NextResponse.json({ error: error.message, stack: error.stack });
    } finally {
        client.release();
    }
}
