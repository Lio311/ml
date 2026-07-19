import { NextResponse } from 'next/server';
import pool, { sql } from '../../lib/db';

export async function GET() {
    try {
        const rows = await sql("SELECT DISTINCT brand FROM products WHERE brand IS NOT NULL AND brand != '' ORDER BY brand ASC");
        const brands = rows.map(r => ({ id: r.brand, name: r.brand }));
        return NextResponse.json(brands);
    } catch (error) {
        console.error('Get Brands Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
