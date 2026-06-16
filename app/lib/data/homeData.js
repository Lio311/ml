import { withClient } from "../db";
import { sanitizeProductArray } from "../productUtils";

export async function getHomeData() {
    let newArrivals = [];
    let topCatalogs = [];
    let stats = { brands: 0, products: 0, samples: 500 };
    let banners = [{ type: 'video', url: '/hero-video.mp4', objectPosition: 'center' }];

    try {
        await withClient(async (client) => {
            const [
                newArrivalsRes,
                productCountRes,
                brandCountRes,
                brandsRes,
                ordersRes,
                topCatRes,
                bannerRes
            ] = await Promise.all([
                client.query('SELECT id, brand, model, price_2ml, price_5ml, price_10ml, image_url, category, in_lottery, slug, description, stock, brand_he, model_he, original_size, created_at, discount_percentage, discount_sizes, discount_end_date, is_discovery_set, single_price, volume_label FROM products WHERE active = true AND stock > 0 AND show_on_home = true ORDER BY created_at DESC LIMIT 6').catch(e => { console.error(e); return { rows: [] }; }),
                client.query('SELECT COUNT(*) FROM products WHERE active = true AND stock > 0 AND (is_discovery_set IS NULL OR is_discovery_set = false)').catch(e => { console.error(e); return { rows: [{ count: 0 }] }; }),
                client.query('SELECT COUNT(DISTINCT brand) FROM products WHERE active = true AND stock > 0').catch(e => { console.error(e); return { rows: [{ count: 0 }] }; }),
                client.query('SELECT name, logo_url FROM brands WHERE logo_url IS NOT NULL ORDER BY RANDOM()').catch(e => { console.error(e); return { rows: [] }; }),
                client.query(`
                    SELECT COALESCE(SUM((item->>'quantity')::integer), 0) as total
                    FROM orders, jsonb_array_elements(items::jsonb) as item
                    WHERE status != 'cancelled'
                `).catch(e => { console.error(e); return { rows: [{ total: 0 }] }; }),
                client.query(`
                    SELECT c.id, c.name, c.slug, c.description, c.image_url, COUNT(o.id) as order_count
                    FROM user_catalogs c
                    LEFT JOIN orders o ON c.id = o.catalog_id
                    WHERE c.is_hidden IS FALSE OR c.is_hidden IS NULL
                    GROUP BY c.id
                    ORDER BY order_count DESC, c.created_at DESC
                    LIMIT 3
                `).catch(e => { console.error(e); return { rows: [] }; }),
                client.query("SELECT value FROM site_settings WHERE key = 'home_banner'").catch(e => { console.error(e); return { rows: [] }; })
            ]);

            newArrivals = sanitizeProductArray(newArrivalsRes.rows);
            stats.products = parseInt(productCountRes.rows[0].count);
            stats.brands = parseInt(brandCountRes.rows[0].count);
            stats.allBrands = sanitizeProductArray(brandsRes.rows);
            stats.samples += parseInt(ordersRes.rows[0].total) || 0;
            topCatalogs = sanitizeProductArray(topCatRes.rows);

            if (bannerRes.rows.length > 0) {
                const bannerData = bannerRes.rows[0].value;
                if (Array.isArray(bannerData)) {
                    const activeBanners = bannerData.filter(b => !b.isHidden);
                    banners = activeBanners.length > 0 ? activeBanners : banners;
                } else {
                    banners = bannerData.isHidden ? banners : [bannerData];
                }
            }
        });
    } catch (err) {
        console.error("Error fetching homepage data:", err);
    }

    return { newArrivals, topCatalogs, stats, banners };
}
