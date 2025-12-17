import pool from './lib/db';

export default async function sitemap() {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://ml-tlv.vercel.app';

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
        const productsRes = await client.query('SELECT id, updated_at FROM products WHERE active = true');
        products = productsRes.rows.map((product) => ({
            url: `${baseUrl}/product/${product.id}`,
            lastModified: product.updated_at || new Date(),
            changeFrequency: 'weekly',
            priority: 0.9,
        }));

        // Brands (Distinct)
        const brandsRes = await client.query('SELECT DISTINCT brand FROM products WHERE active = true');
        brands = brandsRes.rows
            .filter(r => r.brand)
            .map((r) => ({
                url: `${baseUrl}/catalog?brand=${encodeURIComponent(r.brand)}`,
                lastModified: new Date(),
                changeFrequency: 'daily',
                priority: 0.7,
            }));

        // Categories (Distinct)
        // Categories typically stored as comma separated strings in this DB, need to split? 
        // Based on previous files, they seem to be simple strings usually. Assuming simple string first.
        const catRes = await client.query('SELECT DISTINCT category FROM products WHERE active = true');
        const uniqueCats = new Set();
        catRes.rows.forEach(r => {
            if (r.category) {
                // Split by comma just in case
                r.category.split(',').forEach(c => uniqueCats.add(c.trim()));
            }
        });

        categories = Array.from(uniqueCats).map((cat) => ({
            url: `${baseUrl}/catalog?category=${encodeURIComponent(cat)}`,
            lastModified: new Date(),
            changeFrequency: 'daily',
            priority: 0.7,
        }));

        // Blog Posts
        const blogRes = await client.query('SELECT slug, updated_at FROM blog_posts');
        const blogs = blogRes.rows.map((post) => ({
            url: `${baseUrl}/blog/${post.slug}`,
            lastModified: post.updated_at || new Date(),
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
        return [...staticRoutes, blogIndex, ...products, ...brands, ...categories, ...blogs];
    } catch (error) {
        console.error("Sitemap generation error:", error);
        return [...staticRoutes];
    }
}
