import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import pool from "@/app/lib/db";

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses?.[0]?.emailAddress;
        const isSuperAdmin = email === process.env.ADMIN_EMAIL;

        if (!isSuperAdmin && role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            // Get all reviews ordered by rating (worst first)
            let reviews = [];
            try {
                const result = await client.query(`
                    SELECT r.*, p.image_url, p.active
                    FROM product_desc_reviews r
                    LEFT JOIN products p ON p.id = r.product_id
                    ORDER BY r.rating ASC, r.reviewed_at DESC
                `);
                reviews = result.rows;
            } catch (queryError) {
                // If table doesn't exist, we'll just return an empty list
                if (queryError.code === '42P01') {
                    return NextResponse.json({ reviews: [], stats: { total_with_desc: 0, total_reviewed: 0 }, tableExists: false });
                }
                throw queryError;
            }

            // Get total products with descriptions and how many are reviewed
            const statsResult = await client.query(`
                SELECT 
                    COUNT(*) FILTER (WHERE description IS NOT NULL AND description != '') as total_with_desc
                FROM products
                WHERE active = true
            `);

            return NextResponse.json({ 
                reviews,
                stats: {
                    ...statsResult.rows[0],
                    total_reviewed: reviews.length
                },
                tableExists: true
            });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Desc review list error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
