import pool from '../lib/db';
import ClientLandingPage from './ClientLandingPage';

export const revalidate = 3600;

export const metadata = {
    title: "דף הבית | ml_tlv",
    description: "Niche & Boutique Sample Collections",
};

export default async function LandingPage() {
    let newArrivals = [];
    let stats = { brands: 0, products: 0, samples: 500, allBrands: [] };

    try {
        const client = await pool.connect();

        // Fetch New Arrivals
        const res = await client.query('SELECT * FROM products WHERE stock > 0 ORDER BY created_at DESC LIMIT 4');
        newArrivals = res.rows;

        // Fetch Stats
        try {
            const productCountRes = await client.query('SELECT COUNT(*) FROM products WHERE active = true');
            const brandCountRes = await client.query('SELECT COUNT(DISTINCT brand) FROM products WHERE active = true');

            stats.products = parseInt(productCountRes.rows[0].count);
            stats.brands = parseInt(brandCountRes.rows[0].count);

            // Fetch brands
            const brandsRes = await client.query('SELECT name, logo_url FROM brands WHERE logo_url IS NOT NULL ORDER BY RANDOM()');
            stats.allBrands = brandsRes.rows;

            // Try to get orders count for samples estimation
            try {
                const ordersRes = await client.query("SELECT items FROM orders WHERE status != 'cancelled'");
                const totalSamplesSold = ordersRes.rows.reduce((acc, row) => {
                    const items = row.items || [];
                    const orderSum = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
                    return acc + orderSum;
                }, 0);
                stats.samples += totalSamplesSold;
            } catch (e) {
                // Orders table might not exist or be empty, ignore
            }

        } catch (e) {
            console.error("Stats error", e);
        }

        client.release();
    } catch (err) {
        console.error("Error fetching landing page data:", err);
    }

    return (
        <ClientLandingPage
            newArrivals={newArrivals}
            stats={stats}
        />
    );
}
