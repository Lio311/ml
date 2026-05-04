import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import pool from "@/app/lib/db";

export const dynamic = 'force-dynamic';

export async function POST() {
    try {
        const user = await currentUser();
        const email = user?.emailAddresses?.[0]?.emailAddress;
        if (email !== process.env.ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const client = await pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS product_desc_reviews (
                    id SERIAL PRIMARY KEY,
                    product_id INTEGER NOT NULL,
                    brand TEXT,
                    model TEXT,
                    description TEXT,
                    description_hash TEXT NOT NULL,
                    rating INTEGER NOT NULL DEFAULT 0,
                    suggestions TEXT,
                    suggested_rewrite TEXT,
                    strengths TEXT,
                    reviewed_at TIMESTAMP DEFAULT NOW(),
                    UNIQUE(product_id, description_hash)
                )
            `);
            // Also attempt to add it if table already exists
            try {
                await client.query(`ALTER TABLE product_desc_reviews ADD COLUMN IF NOT EXISTS suggested_rewrite TEXT`);
            } catch (e) {}
            return NextResponse.json({ success: true, message: 'Table created successfully' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Setup desc reviews error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
