import pool from "../lib/db";
import { auth } from '@clerk/nextjs/server';
import ProductCard from "../components/ProductCard";
import Link from "next/link";
import { redirect } from 'next/navigation';

export default async function WishlistPage() {
    const { userId } = await auth();

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
        products = res.rows;
        client.release();
    } catch (err) {
        console.error("Wishlist Page Error:", err);
    }

    return (
        <div className="container py-12 min-h-[60vh]">
            <h1 className="text-3xl font-serif font-bold mb-8 text-center">המועדפים שלי ❤️</h1>

            {products.length === 0 ? (
                <div className="text-center py-12">
                    <p className="text-xl text-gray-500 mb-4">רשימת המשאלות שלך ריקה.</p>
                    <Link href="/catalog" className="btn btn-primary">
                        עבור לקטלוג
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
