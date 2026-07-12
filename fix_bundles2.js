const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_eDnf86UqXiGP@ep-jolly-frost-ag6p8f9f-pooler.c-2.eu-central-1.aws.neon.tech/neondb?sslmode=require'
});

const defaultBundles = [
    {
        type: 'clean_bundle',
        items: [
            'Musk Therapy', 'Blanche', 'The Muse', '11 11',
            '724', 'Not A Perfume', 'Lazy Sunday Morning',
            'Milky Musk', 'Pure Grace', 'Fleur de Peau'
        ]
    },
    {
        type: 'tropical_bundle',
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
    },
    {
        type: 'floral_bundle',
        items: [
            'Delina',
            'Cruel Gardenia',
            'A La Rose',
            'Spring Flower',
            'Fleur Narcotique',
            'Good Girl Gone Bad',
            'Guidance',
            'Room Service',
            'Rose Barbare',
            'French Leather'
        ]
    },
    {
        type: 'aquatic_bundle',
        items: [
            'Megamare',
            'Costa Azzurra',
            'Silver Mountain Water',
            'Virgin Island Water',
            'Pacific Rock Moss',
            'Wood Sage & Sea Salt',
            'Mirto di Panarea',
            'Acqua di Gio Profumo',
            '40 Knots',
            'Sailing Day'
        ]
    }
];

async function run() {
    console.log("Fetching site settings...");
    const settingsRes = await pool.query("SELECT bundles_config FROM site_settings WHERE id = 1");
    let bundlesConfig = settingsRes.rows[0]?.bundles_config;
    if (!bundlesConfig) bundlesConfig = {};

    for (const b of defaultBundles) {
        let matchedIds = [];
        for (let itemName of b.items) {
            let searchStr = itemName;
            if (itemName.includes(' - ')) {
                searchStr = itemName.split(' - ')[1].trim();
            }

            const res = await pool.query(`SELECT id, name, brand, model FROM products WHERE (name ILIKE $1 OR model ILIKE $1) AND active = true LIMIT 1`, [`%${searchStr}%`]);
            if (res.rows.length > 0) {
                console.log(`[${b.type}] Match found for "${itemName}": ${res.rows[0].name} (ID: ${res.rows[0].id})`);
                matchedIds.push(res.rows[0].id);
            } else {
                console.log(`[${b.type}] MISSING: "${itemName}"`);
            }
        }
        
        if (matchedIds.length < 10) {
            console.log(`[${b.type}] Only found ${matchedIds.length}, grabbing random to fill 10...`);
            const fallbackRes = await pool.query(`SELECT id FROM products WHERE active = true AND is_discovery_set = false AND id != ALL($1::int[]) ORDER BY RANDOM() LIMIT $2`, [matchedIds, 10 - matchedIds.length]);
            matchedIds = [...matchedIds, ...fallbackRes.rows.map(r => r.id)];
        }

        matchedIds = matchedIds.slice(0, 10);
        bundlesConfig[b.type] = matchedIds;
    }

    await pool.query("UPDATE site_settings SET bundles_config = $1 WHERE id = 1", [JSON.stringify(bundlesConfig)]);
    console.log("Updated site_settings bundles_config!");
    pool.end();
}

run().catch(console.error);
