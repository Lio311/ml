import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

const bundlesToCreate = [
    {
        type: 'clean_bundle',
        name: 'קולקציית נקיים ורעננים',
        description: 'קולקציה ייחודית של בשמים נקיים, רעננים וסבוניים.',
        image: '/images/bundles/clean.webp',
        items: [
            'Escentric Molecules - Molecule 01',
            'Teo Cabanel - Et Voilà',
            'SW19 - 6am',
            'SW19 - Noon',
            'Fascent  - Milky No Way',
            'Agarthi - Floating Lands',
            'Guerlain - Musc Noble',
            'Atelier Materi -  Iris Ebène',
            'ASMR Fragrances - Ocean Relaxation',
            'Jorum Studio - Trimerous'
        ]
    },
    {
        type: 'tropical_bundle',
        name: 'קולקציית מנגו וטרופי',
        description: 'אווירת חופשה טרופית, קוקטיילים ומנגו עסיסי.',
        image: '/images/bundles/tropical.webp',
        items: [
            'Vilhelm Parfumerie - Mango Skin',
            'Memoirs Of A Perfume Collector - Trouble In Paradise',
            'iPiccirilli - Cocobay',
            'Simone Andreoli - Malibu - Party in the Bay',
            'Mango Sticky Rice',
            'Renoir Parfums - Mojito Erotique',
            'Fragrance Du Bois - Oud Jaune Intense',
            'Imaginary Authors -  In Love With Everything',
            'Memoirs Of A Perfume Collector - Tales from Zanzibar',
            'Mango White'
        ]
    },
    {
        type: 'vanilla_bundle',
        name: 'קולקציית וניל',
        description: 'חגיגה של וניל, ענבר וריחות חמימים.',
        image: '/images/bundles/vanilla.webp',
        items: [
            'Xerjoff - Lira',
            'Parfums de Marly - Pegasus',
            'Dior - Tobacolor',
            'Sora Dora - Jany',
            'The Harmonist - Hypnotizing Fire',
            'Guerlain - L\'Instant de Guerlain pour Homme',
            'Initio - Blessed Baraka',
            'Yves Saint Laurent - Tuxedo',
            'De Gabor - Darling',
            'Thomas de Monaco - Raw Gold'
        ]
    },
    {
        type: 'gourmand_bundle',
        name: 'קולקציית קינוחים / גורמנד',
        description: 'למי שאוהב ריחות מתוקים, מאפים וקינוחים.',
        image: '/images/bundles/gourmand.webp',
        items: [
            'ASMR Fragrances - Chocolate Crush',
            'ASMR Fragrances - Yummy Tingles',
            'Bohoboco -  Sea Salt Caramel',
            'The Lab - Amber Chocolate',
            'Theodoros Kalotinis - Peach Macaron',
            'Maie Piou - Cherry Harley',
            'Soma Parfums - Halcyon',
            'Bergamoss - Mango Sticky Rice',
            'Xerjoff - Lira',
            'Sora Dora - Jany'
        ]
    },
    {
        type: 'citrus_bundle',
        name: 'קולקציית הדרים',
        description: 'רעננות הדרית מושלמת, אשכוליות ולימונים.',
        image: '/images/bundles/citrus.webp',
        items: [
            'Farmacia SS. Annunziata - Citrus Paradisi',
            'Simone Andreoli - Zest di Sorrento',
            'Colours Of Capri',
            'Ermenegildo Zegna - Italian Bergamot Eau de Parfum',
            'Memoirs Of A Perfume Collector - Pacific Grapefruit',
            'Dolce&Gabbana - Light Blue Forever pour Homme',
            'Giorgio Armani - Acqua di Gio Essenza',
            'Boadicea the Victorious - Energizer',
            'Clive Christian - 1872 For Men',
            'Creed -  Aventus 15X01'
        ]
    }
];

export async function GET(req) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            const bundlesConfig = {};

            for (const bundle of bundlesToCreate) {
                // 1. Create or get the bundle product
                let bundleProductRes = await client.query(
                    `SELECT id FROM products WHERE discovery_type = $1 AND is_discovery_set = true`,
                    [bundle.type]
                );

                let bundleProductId;
                if (bundleProductRes.rows.length === 0) {
                    const insertRes = await client.query(`
                        INSERT INTO products (
                            name, name_he, description_he, image_url, category, category_en, 
                            active, is_discovery_set, discovery_type, stock,
                            price_2ml, price_5ml, price_10ml, show_on_home, single_price
                        ) VALUES (
                            $1, $2, $3, $4, 'מארזים', 'bundles',
                            true, true, $5, 100,
                            190, 390, 690, true, 190
                        ) RETURNING id
                    `, [bundle.name, bundle.name, bundle.description, bundle.image, bundle.type]);
                    bundleProductId = insertRes.rows[0].id;
                } else {
                    bundleProductId = bundleProductRes.rows[0].id;
                }

                // 2. Find product IDs for the items
                const itemIds = [];
                for (const itemName of bundle.items) {
                    const parts = itemName.split(' - ');
                    const searchTerm = parts[parts.length - 1].trim();
                    const searchRes = await client.query(
                        `SELECT id FROM products WHERE name ILIKE $1 OR name_he ILIKE $1 OR name_en ILIKE $1 LIMIT 1`,
                        [`%${searchTerm}%`]
                    );
                    if (searchRes.rows.length > 0) {
                        itemIds.push(searchRes.rows[0].id);
                    } else {
                        console.warn(`Warning: Could not find product for ${itemName}`);
                    }
                }

                bundlesConfig[bundleProductId] = {
                    type: bundle.type,
                    name: bundle.name,
                    items: itemIds
                };
            }

            // 3. Save to site_settings
            await client.query(`
                INSERT INTO site_settings (key, value)
                VALUES ('bundles_config', $1)
                ON CONFLICT (key) DO UPDATE SET value = $1
            `, [JSON.stringify(bundlesConfig)]);

            await client.query('COMMIT');
            return NextResponse.json({ success: true, message: 'Bundles setup complete', config: bundlesConfig });
        } catch (dbErr) {
            await client.query('ROLLBACK');
            throw dbErr;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Setup Bundles Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
