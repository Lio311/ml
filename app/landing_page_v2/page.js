import pool from '../lib/db';
import ClientLandingV2 from './ClientLandingV2';

export const metadata = {
    title: 'ML_TLV | Boutique Perfumes',
    description: 'Luxury Niche Perfume Samples',
};

async function getLandingData() {
    const client = await pool.connect();
    try {
        // 1. New Arrivals (Stock > 0, Newest 4) - Same as homepage
        const newArrivalsRes = await client.query(`
      SELECT * FROM products 
      WHERE stock > 0 
      ORDER BY created_at DESC 
      LIMIT 4
    `);

        // 2. Stats & Brands
        const brandsRes = await client.query('SELECT name, logo_url FROM brands');
        const productsStartRes = await client.query('SELECT COUNT(*) FROM products');

        const stats = {
            brands: brandsRes.rowCount,
            products: parseInt(productsStartRes.rows[0].count) + 1500, // Matching homepage logic
            samples: 5000, // Static or DB based
            allBrands: brandsRes.rows
        };

        return {
            newArrivals: newArrivalsRes.rows,
            stats
        };

    } catch (error) {
        console.error('Error fetching landing page data:', error);
        return { newArrivals: [], stats: { brands: 0, products: 0, samples: 0, allBrands: [] } };
    } finally {
        client.release();
    }
}

export default async function LandingPageV2() {
    const data = await getLandingData();
    return <ClientLandingV2 newArrivals={data.newArrivals} stats={data.stats} />;
}
