import { withClient } from "../db";
import { sanitizeProductArray } from "../productUtils";

export async function getHomeData() {
    let newArrivals = [];
    let topCatalogs = [];
    let stats = { brands: 0, products: 0, samples: 500 };
    let banners = [{ type: 'video', url: '/hero-video.mp4', objectPosition: 'center' }];

    try {
        await withClient(async (client) => {
            // Fetch New Arrivals (Only in stock)
            const res = await client.query('SELECT id, brand, model, price_2ml, price_5ml, price_10ml, image_url, category, in_lottery, slug, description, stock, brand_he, model_he, original_size, created_at, discount_percentage, discount_sizes, discount_end_date, is_discovery_set, single_price, volume_label FROM products WHERE active = true AND stock > 0 AND show_on_home = true ORDER BY created_at DESC LIMIT 6');
            newArrivals = sanitizeProductArray(res.rows);

            // Fetch Stats
            try {
                const productCountRes = await client.query('SELECT COUNT(*) FROM products WHERE active = true AND stock > 0');
                const brandCountRes = await client.query('SELECT COUNT(DISTINCT brand) FROM products WHERE active = true AND stock > 0');

                stats.products = parseInt(productCountRes.rows[0].count);
                stats.brands = parseInt(brandCountRes.rows[0].count);

                // Fetch all brands for carousel (Randomized) 
                const brandsRes = await client.query('SELECT name, logo_url FROM brands WHERE logo_url IS NOT NULL ORDER BY RANDOM()');
                stats.allBrands = sanitizeProductArray(brandsRes.rows);

                // Try to get orders count for samples estimation
                try {
                    const ordersRes = await client.query("SELECT items FROM orders WHERE status != 'cancelled'");
                    const totalSamplesSold = ordersRes.rows.reduce((acc, row) => {
                        const items = row.items || [];
                        const orderSum = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
                        return acc + orderSum;
                    }, 0);
                    stats.samples += totalSamplesSold;
                } catch (e) {}
            } catch (e) {
                console.error("Stats error", e);
            }

            // Fetch Top Catalogs
            try {
                const topCatRes = await client.query(`
                    SELECT c.id, c.name, c.slug, c.description, c.image_url, COUNT(o.id) as order_count
                    FROM user_catalogs c
                    LEFT JOIN orders o ON c.id = o.catalog_id
                    WHERE c.is_hidden IS FALSE OR c.is_hidden IS NULL
                    GROUP BY c.id
                    ORDER BY order_count DESC, c.created_at DESC
                    LIMIT 3
                `);
                topCatalogs = sanitizeProductArray(topCatRes.rows);
            } catch (e) {
                console.error("Top catalogs error", e);
            }

            // Fetch Banner
            try {
                const bannerRes = await client.query("SELECT value FROM site_settings WHERE key = 'home_banner'");
                if (bannerRes.rows.length > 0) {
                    const bannerData = bannerRes.rows[0].value;
                    if (Array.isArray(bannerData)) {
                        const activeBanners = bannerData.filter(b => !b.isHidden);
                        banners = activeBanners.length > 0 ? activeBanners : banners;
                    } else {
                        banners = bannerData.isHidden ? banners : [bannerData];
                    }
                }
            } catch (e) {
                console.error("Banner fetch error", e);
            }
        });
    } catch (err) {
        console.error("Error fetching homepage data:", err);
    }

    return { newArrivals, topCatalogs, stats, banners };
}
