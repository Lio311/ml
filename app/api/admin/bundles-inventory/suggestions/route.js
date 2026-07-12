import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

export async function GET(req) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const url = new URL(req.url);
        const productId = url.searchParams.get('product_id');
        if (!productId) return NextResponse.json({ error: 'Missing product_id' }, { status: 400 });

        const client = await pool.connect();
        try {
            // Get original product
            const origRes = await client.query('SELECT * FROM products WHERE id = $1', [productId]);
            if (origRes.rows.length === 0) return NextResponse.json({ suggestions: [] });
            const orig = origRes.rows[0];

            // Same category or brand, in stock
            const suggestionsRes = await client.query(`
                SELECT id, name, brand, model, stock, volume_ml, categories, notes_he 
                FROM products 
                WHERE id != $1 
                AND stock > 0
                AND is_active = true
                AND (brand = $2 OR categories && $3)
                LIMIT 10
            `, [productId, orig.brand, orig.categories || []]);
            
            return NextResponse.json({ suggestions: suggestionsRes.rows.slice(0, 3) });
        } finally {
            client.release();
        }
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
