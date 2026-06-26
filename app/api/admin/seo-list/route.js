import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses?.[0]?.emailAddress;
        const isSuperAdmin = email === process.env.ADMIN_EMAIL;

        if (!isSuperAdmin && role !== 'admin' && role !== 'viewer') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            const res = await client.query(`
                SELECT id, title, title_en, slug, excerpt, status, created_at 
                FROM blog_posts 
                ORDER BY created_at DESC
            `);
            
            const drafts = [];
            const published = [];

            res.rows.forEach(post => {
                if (post.status === 'draft') {
                    drafts.push(post);
                } else {
                    published.push(post);
                }
            });

            return NextResponse.json({ drafts, published });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("SEO List Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

