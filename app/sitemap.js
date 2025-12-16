import pool from './lib/db';

export default async function sitemap() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ml-tlv.vercel.app';

    // Static Routes
    const routes = [
        '',
        '/catalog',
        '/about',
        '/contact',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: route === '' ? 1 : 0.8,
    }));

    // Dynamic Product Routes
    let products = [];
    try {
        const client = await pool.connect();
        const res = await client.query('SELECT id, updated_at FROM products WHERE active = true');
        client.release();

        products = res.rows.map((product) => ({
            url: `${baseUrl}/product/${product.id}`,
            lastModified: product.updated_at || new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        }));
    } catch (error) {
        console.error("Sitemap generation error:", error);
    }

    return [...routes, ...products];
}
