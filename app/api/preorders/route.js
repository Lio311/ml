import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { currentUser } from '@clerk/nextjs/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function GET(req) {
    try {
        const user = await currentUser();
        const userEmail = user?.emailAddresses?.[0]?.emailAddress;
        const role = user?.publicMetadata?.role;

        if (!userEmail) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const isSuperAdmin = userEmail === ADMIN_EMAIL;
        const currentRole = isSuperAdmin ? 'admin' : role;

        if (currentRole !== 'admin' && currentRole !== 'deputy' && currentRole !== 'viewer') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const client = await pool.connect();
        try {
            // Lazy migration to ensure table exists
            await client.query(`
                CREATE TABLE IF NOT EXISTS preorders (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
                    user_email TEXT NOT NULL,
                    status TEXT DEFAULT 'pending', 
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    notified_at TIMESTAMP WITH TIME ZONE,
                    converted_at TIMESTAMP WITH TIME ZONE,
                    UNIQUE(product_id, user_email)
                );
            `);

            // Also ensure is_preorder column exists on products
            await client.query(`
                ALTER TABLE products ADD COLUMN IF NOT EXISTS is_preorder BOOLEAN DEFAULT false;
            `);

            const query = `
                SELECT 
                    p.id as product_id,
                    p.name,
                    p.brand,
                    p.image_url,
                    p.is_preorder,
                    COUNT(po.id) as total_registrations,
                    SUM(CASE WHEN po.status = 'notified' THEN 1 ELSE 0 END) as notified_count,
                    SUM(CASE WHEN po.status = 'converted' THEN 1 ELSE 0 END) as converted_count,
                    json_agg(
                        json_build_object(
                            'id', po.id,
                            'user_email', po.user_email,
                            'status', po.status,
                            'created_at', po.created_at,
                            'converted_at', po.converted_at
                        )
                    ) as preorders
                FROM products p
                LEFT JOIN preorders po ON p.id = po.product_id
                WHERE p.is_preorder = true OR po.id IS NOT NULL
                GROUP BY p.id, p.name, p.brand, p.image_url, p.is_preorder
                ORDER BY p.name ASC
            `;
            const result = await client.query(query);
            return NextResponse.json(result.rows);
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error fetching preorders:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
