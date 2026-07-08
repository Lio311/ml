import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET() {
    let client;
    try {
        client = await pool.connect();
        
        // Fetch unique notes from top_notes, middle_notes, and base_notes
        // We split by comma and trim to get individual notes
        const res = await client.query(`
            SELECT DISTINCT trim(unnest(string_to_array(top_notes, ','))) as note FROM products WHERE top_notes IS NOT NULL AND top_notes != ''
            UNION
            SELECT DISTINCT trim(unnest(string_to_array(middle_notes, ','))) as note FROM products WHERE middle_notes IS NOT NULL AND middle_notes != ''
            UNION
            SELECT DISTINCT trim(unnest(string_to_array(base_notes, ','))) as note FROM products WHERE base_notes IS NOT NULL AND base_notes != ''
            ORDER BY note ASC
        `);

        const notes = res.rows.map(row => row.note).filter(note => note && note.length > 0);

        return NextResponse.json(notes);
    } catch (error) {
        console.error('Error fetching fragrance notes:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        if (client) client.release();
    }
}
