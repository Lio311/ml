import pool from "@/app/lib/db";
import DiscoverySetsClient from "./DiscoverySetsClient";
import { currentUser } from "@clerk/nextjs/server";

export const metadata = {
    title: "ניהול דיסקברי סט ודוגמיות",
    robots: "noindex, nofollow",
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminDiscoverySetsPage(props) {
    const searchParams = await props.searchParams;
    const search = searchParams?.q || '';
    
    let products = [];
    
    const client = await pool.connect();
    try {
        let query = 'SELECT id, brand, model, name, image_url, image_url_2, image_url_3, description, stock, single_price, volume_label, show_on_home, active, slug, discovery_type FROM products WHERE is_discovery_set = true';
        const params = [];
        
        if (search) {
            query += ` AND (brand ILIKE $1 OR model ILIKE $1 OR name ILIKE $1)`;
            params.push(`%${search}%`);
        }
        
        query += ' ORDER BY id DESC';
        
        const res = await client.query(query, params);
        products = res.rows;
    } finally {
        client.release();
    }

    const user = await currentUser();
    const canEdit = user?.publicMetadata?.role === 'admin' || user?.emailAddresses[0]?.emailAddress === process.env.ADMIN_EMAIL;

    return (
        <DiscoverySetsClient
            products={products}
            initialSearch={search}
            canEdit={canEdit}
        />
    );
}
