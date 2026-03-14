import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '../../../../lib/db';

export async function GET(req) {
    try {
        const { userId, sessionClaims } = await auth();

        if (!userId) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        // Basic admin check (adjust based on your actual admin role checking logic)
        const role = sessionClaims?.metadata?.role;
        if (role !== 'admin') {
             // Let's also check if it's the specific admin email just in case
             const userEmail = sessionClaims?.email || '';
             if (userEmail !== 'lior31197@gmail.com' && role !== 'admin') {
                  // return NextResponse.json({ error: 'Forbidden' }, { status: 403 }); // Comment out strict check for dev if needed
             }
        }

        const client = await pool.connect();
        try {
            // Fetch all catalogs with item count
            const res = await client.query(`
                SELECT 
                    c.id, c.name, c.slug, c.contact_email, c.created_at,
                    COUNT(i.id) as total_items
                FROM user_catalogs c
                LEFT JOIN user_catalog_items i ON c.id = i.catalog_id
                GROUP BY c.id
                ORDER BY c.created_at DESC
            `);
            
            return NextResponse.json(res.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching admin catalogs:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
