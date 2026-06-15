import pool from '../lib/db';
import { sanitizeProductArray } from '../lib/productUtils';
import JourneyClient from './JourneyClient';

export const metadata = {
    title: 'The Fragrance Journey | ml-tlv',
    description: 'Build your custom luxury fragrance discovery box with our interactive lab.',
    robots: 'index, follow'
};

export default async function JourneyPage() {
    let products = [];
    try {
        const client = await pool.connect();
        // Fetch top products (with images and prices) to serve as the building blocks
        const res = await client.query(`
            SELECT id, brand, name, category, image_url, price_2ml, price_5ml, price_10ml, single_price, is_discovery_set, volume_label, top_notes
            FROM products
            WHERE active = true AND image_url IS NOT NULL AND (price_2ml IS NOT NULL OR price_5ml IS NOT NULL)
            ORDER BY RANDOM()
            LIMIT 30
        `);
        products = sanitizeProductArray(res.rows);
        client.release();
    } catch (e) {
        console.error('Error fetching journey products:', e);
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-white selection:text-black">
            <JourneyClient initialProducts={products} />
        </div>
    );
}
