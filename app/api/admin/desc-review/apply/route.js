import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import pool from "@/app/lib/db";
import { revalidatePath } from "next/cache";
import { translateText } from "../../../../lib/translate";

export const dynamic = 'force-dynamic';

export async function POST(req) {
    try {
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses?.[0]?.emailAddress;
        const isSuperAdmin = email === process.env.ADMIN_EMAIL;

        if (!isSuperAdmin && role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { productId, rewrite } = await req.json();

        if (!productId || !rewrite) {
            return NextResponse.json({ error: 'Missing data' }, { status: 400 });
        }

        const rewrite_en = await translateText(rewrite);

        const client = await pool.connect();
        try {
            // Update the product description (and its aliases)
            await client.query(
                'UPDATE products SET description = $1, description_he = $1, description_en = $3 WHERE id = $2',
                [rewrite, productId, rewrite_en]
            );
            
            // Delete the obsolete review
            await client.query(
                'DELETE FROM product_desc_reviews WHERE product_id = $1',
                [productId]
            );
            
            revalidatePath('/');
            revalidatePath('/catalog');
            revalidatePath('/product/[slug]', 'page');
            
            return NextResponse.json({ success: true, message: 'Description updated successfully' });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Apply rewrite error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
