import pool from "../lib/db";
import { auth } from '@clerk/nextjs/server';
import ProductCard from "../components/ProductCard";
import Link from "next/link";
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { getT } from '../lib/getT';
import { sanitizeProductArray } from "../lib/productUtils";


export async function generateMetadata() {
    const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'he';
    const t = await getT(locale);
    
    return {
        title: t('wishlist.meta_title'),
        description: t('wishlist.meta_desc'),
    };
}

export default async function WishlistPage() {
    const { userId } = await auth();
    const locale = (await cookies()).get('NEXT_LOCALE')?.value || 'he';
    const t = await getT(locale);

    if (!userId) {
        redirect('/');
    }

    let products = [];
    try {
        const client = await pool.connect();
        const res = await client.query(`
            SELECT p.* 
            FROM products p
            JOIN wishlist w ON p.id = w.product_id
            WHERE w.user_id = $1
            ORDER BY w.created_at DESC
        `, [userId]);
        products = sanitizeProductArray(res.rows);
        client.release();
    } catch (err) {
        console.error("Wishlist Page Error:", err);
    }

    return (
        <div className="container py-12 min-h-[60vh]">
            <h1 className="text-3xl font-serif font-bold mb-8 text-center">{t('wishlist.title')}</h1>

            {products.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-xl text-gray-500 mb-4">{t('wishlist.empty')}</p>
                    <Link href="/catalog" className="btn btn-primary">
                        {t('wishlist.go_to_catalog')}
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}
