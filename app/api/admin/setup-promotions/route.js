import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { checkAdmin } from '../../../lib/admin';

export async function GET() {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Add discount_percentage
            await client.query(`
                ALTER TABLE products 
                ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0
            `);

            // Add discount_sizes (array of text)
            await client.query(`
                ALTER TABLE products 
                ADD COLUMN IF NOT EXISTS discount_sizes TEXT[] DEFAULT '{}'
            `);

            await client.query('COMMIT');
            return NextResponse.json({ message: 'Migration successful' });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Migration Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
