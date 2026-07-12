import pool from "../../lib/db";
import BundlesInventoryClient from "./BundlesInventoryClient";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

export const metadata = {
    title: "מלאי חבילות",
    robots: "noindex, nofollow",
};

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function BundlesInventoryPage() {
    const user = await currentUser();
    const email = user?.emailAddresses?.[0]?.emailAddress;
    const role = user?.publicMetadata?.role;
    const isSuperAdmin = email === process.env.ADMIN_EMAIL;
    const canEdit = isSuperAdmin || role === 'admin' || role === 'deputy';

    if (!canEdit) redirect('/admin');

    const client = await pool.connect();
    let bundlesConfig = {};
    let productsMap = {};

    try {
        const settingsRes = await client.query(`SELECT value FROM site_settings WHERE key = 'bundles_config'`);
        if (settingsRes.rows.length > 0) {
            bundlesConfig = settingsRes.rows[0].value || {};
        }

        // Collect all unique product IDs across all bundles
        const allProductIds = new Set();
        for (const bundle of Object.values(bundlesConfig)) {
            if (bundle && bundle.items && Array.isArray(bundle.items)) {
                bundle.items.forEach(id => allProductIds.add(id));
            }
        }

        if (allProductIds.size > 0) {
            const productsRes = await client.query(
                `SELECT id, name, brand, model, stock, volume_ml, categories, notes_he 
                 FROM products WHERE id = ANY($1)`,
                [Array.from(allProductIds)]
            );
            productsRes.rows.forEach(p => {
                productsMap[p.id] = p;
            });
        }
    } finally {
        client.release();
    }

    return (
        <BundlesInventoryClient 
            initialBundlesConfig={bundlesConfig} 
            productsMap={productsMap} 
        />
    );
}
