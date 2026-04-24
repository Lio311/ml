import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';
import { invalidateBrandCache, buildVariants } from '@/app/lib/brand';

const DEFAULT_NAME = 'ml_tlv';

async function ensureTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS site_settings (
            id SERIAL PRIMARY KEY,
            key VARCHAR(255) UNIQUE NOT NULL,
            value JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            await ensureTable(client);
            const res = await client.query(
                "SELECT value FROM site_settings WHERE key = 'brand_name'"
            );
            if (res.rows.length > 0) {
                const stored = res.rows[0].value;
                return NextResponse.json({ ...stored, isDefault: false });
            }
            return NextResponse.json({ name: DEFAULT_NAME, isDefault: true, ...buildVariants(DEFAULT_NAME) });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Brand GET error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { name } = await req.json();
        if (!name || name.trim().length < 2) {
            return NextResponse.json({ error: 'Brand name must be at least 2 characters' }, { status: 400 });
        }

        const trimmed = name.trim();
        const variants = buildVariants(trimmed);

        const client = await pool.connect();
        try {
            await ensureTable(client);
            await client.query(`
                INSERT INTO site_settings (key, value)
                VALUES ('brand_name', $1)
                ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
            `, [JSON.stringify({ name: trimmed, ...variants })]);
            invalidateBrandCache();
            return NextResponse.json({ success: true, name: trimmed, ...variants });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Brand POST error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const client = await pool.connect();
        try {
            await ensureTable(client);
            await client.query("DELETE FROM site_settings WHERE key = 'brand_name'");
            invalidateBrandCache();
            return NextResponse.json({ success: true, name: DEFAULT_NAME, isDefault: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Brand DELETE error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
