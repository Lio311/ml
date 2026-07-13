import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { auth } from '@clerk/nextjs/server';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function GET(req) {
    try {
        const { sessionClaims } = await auth();
        const userEmail = sessionClaims?.email;
        if (!userEmail || userEmail !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
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
