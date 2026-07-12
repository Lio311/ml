import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET(req) {
    const client = await pool.connect();
    try {
        const res = await client.query('SELECT id, name, name_he, brand, model FROM products WHERE active = true ORDER BY id DESC LIMIT 500');
        return NextResponse.json({ count: res.rows.length, products: res.rows });
    } finally {
        client.release();
    }
}
