import pool from './lib/db';

export default async function sitemap() {
    const baseUrl = 'https://www.ml-tlv.com';

    // 1. Static Routes (Expanded)
    const staticRoutes = [
        '',
        '/catalog',
        '/about',
        '/contact',
        '/faq',
        '/terms',
        '/shipping',
        '/privacy',
        '/matching',
        '/lottery'
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: route === '' ? 1 : 0.8,
    }));

    // 2. Dynamic Data Fetching
    let products = [];
    let brands = [];
    let categories = [];

    try {
        const client = await pool.connect();

        // Products
        const productsRes = await client.query('SELECT id, slug, created_at FROM products WHERE active = true');
        products = productsRes.rows.map((product) => ({
            url: `${baseUrl}/product/${product.slug || product.id}`,
            lastModified: product.created_at || new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        }));

        // Brands (Distinct)
        const brandsRes = await client.query('SELECT DISTINCT brand FROM products WHERE active = true');
        brands = brandsRes.rows
            .filter(r => r.brand)
            .map((r) => ({
                url: `${baseUrl}/brands/${encodeURIComponent(r.brand)}`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.7,
            }));

        // Blog Posts
        const blogRes = await client.query("SELECT id, slug, created_at FROM blog_posts WHERE status = 'published' OR status IS NULL");
        const blogs = blogRes.rows.map((post) => ({
            url: `${baseUrl}/blog/${post.slug || post.id}`,
            lastModified: post.created_at || new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
        }));

        const blogIndex = {
            url: `${baseUrl}/blog`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.8,
        };

        client.release();
        return [...staticRoutes, blogIndex, ...products, ...brands, ...blogs];
    } catch (error) {
        console.error("Sitemap generation error:", error);
        return [...staticRoutes];
    }
}
