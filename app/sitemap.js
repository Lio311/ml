import pool from './lib/db';
import { getBrand } from './lib/brand';

export default async function sitemap() {
    const brand = await getBrand();
    const baseUrl = `https://www.${brand.hyphen}.com`;

    // 1. Static Routes — full site hierarchy
    const staticRoutes = [
        { route: '', priority: 1.0, changeFrequency: 'daily' },
        { route: '/catalog', priority: 0.9, changeFrequency: 'daily' },
        { route: '/discovery-sets', priority: 0.9, changeFrequency: 'weekly' },
        { route: '/bundles', priority: 0.85, changeFrequency: 'weekly' },
        { route: '/sales', priority: 0.85, changeFrequency: 'daily' },
        { route: '/brands', priority: 0.8, changeFrequency: 'weekly' },
        { route: '/blog', priority: 0.8, changeFrequency: 'daily' },
        { route: '/about', priority: 0.6, changeFrequency: 'monthly' },
        { route: '/contact', priority: 0.6, changeFrequency: 'monthly' },
        { route: '/faq', priority: 0.6, changeFrequency: 'monthly' },
        { route: '/matching', priority: 0.7, changeFrequency: 'weekly' },
        { route: '/lottery', priority: 0.5, changeFrequency: 'weekly' },
        { route: '/shipping', priority: 0.4, changeFrequency: 'monthly' },
        { route: '/terms', priority: 0.3, changeFrequency: 'yearly' },
        { route: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
        { route: '/accessibility', priority: 0.3, changeFrequency: 'yearly' },
    ].map(({ route, priority, changeFrequency }) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date(),
        changeFrequency,
        priority,
    }));

    // 2. Dynamic Data Fetching
    let products = [];
    let brands = [];
    let blogs = [];

    try {
        const client = await pool.connect();

        // Products
        const productsRes = await client.query('SELECT id, slug, created_at FROM products WHERE active = true');
        products = productsRes.rows.map((product) => ({
            url: `${baseUrl}/product/${product.slug || product.id}`,
            lastModified: product.created_at || new Date(),
            changeFrequency: 'weekly',
            priority: 0.8,
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
        blogs = blogRes.rows.map((post) => ({
            url: `${baseUrl}/blog/${post.slug || post.id}`,
            lastModified: post.created_at || new Date(),
            changeFrequency: 'weekly',
            priority: 0.7,
        }));

        client.release();
        return [...staticRoutes, ...products, ...brands, ...blogs];
    } catch (error) {
        console.error("Sitemap generation error:", error);
        return [...staticRoutes];
    }
}

