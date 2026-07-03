import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { currentUser } from '@clerk/nextjs/server';

async function checkAdmin() {
    const user = await currentUser();
    if (!user) return false;
    const role = user.publicMetadata?.role;
    return role === 'admin';
}

export async function GET(req) {
    if (!(await checkAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await pool.connect();
        try {
            // Check if table exists
            const tableCheck = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = 'public' 
                    AND table_name = 'checkout_errors'
                );
            `);
            const tableExists = tableCheck.rows[0].exists;

            if (!tableExists) {
                return NextResponse.json({ errors: [], stats: {}, tableExists: false });
            }

            // Fetch errors
            const errorsRes = await client.query(`
                SELECT * FROM checkout_errors 
                ORDER BY created_at DESC 
                LIMIT 100
            `);

            // Fetch stats
            const statsRes = await client.query(`
                SELECT 
                    COUNT(*) as total,
                    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 HOURS') as last_24h,
                    COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 DAYS') as last_7d
                FROM checkout_errors
            `);

            return NextResponse.json({
                errors: errorsRes.rows,
                stats: statsRes.rows[0],
                tableExists: true
            });
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("Failed to fetch checkout errors:", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    if (!(await checkAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            await client.query(`
                CREATE TABLE IF NOT EXISTS checkout_errors (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT,
                    user_name TEXT,
                    user_email TEXT,
                    user_phone TEXT,
                    error_message TEXT,
                    cart_items JSONB,
                    total_amount NUMERIC,
                    created_at TIMESTAMP DEFAULT NOW(),
                    is_resolved BOOLEAN DEFAULT false
                );
            `);
            
            await client.query('COMMIT');
            return NextResponse.json({ success: true });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (e) {
        console.error("Setup error:", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function PATCH(req) {
    if (!(await checkAdmin())) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { id, action } = body;
        
        if (!id || !action) {
            return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
        }
        
        if (action === 'resolve') {
            await pool.query('UPDATE checkout_errors SET is_resolved = true WHERE id = $1', [id]);
        } else if (action === 'unresolve') {
            await pool.query('UPDATE checkout_errors SET is_resolved = false WHERE id = $1', [id]);
        } else if (action === 'delete') {
            await pool.query('DELETE FROM checkout_errors WHERE id = $1', [id]);
        }
        
        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Patch error:", e);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
