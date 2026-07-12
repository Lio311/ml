require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const BUNDLE_MAPPINGS = {
    clean_bundle: [
        { brand: 'The Lab', model: 'FLOATING LANDS' },
        { brand: 'Farmacia SS. Annunziata', model: 'TRIMEROUS' },
        { brand: 'Montale', model: 'White Musk' },
        { brand: 'Maison Margiela', model: 'Lazy Sunday Morning' },
        { brand: 'Byredo', model: 'Blanche' },
        { brand: 'Xerjoff', model: 'Apollonia' },
        { brand: 'The Lab', model: 'IRIS EBENE' },
        { brand: 'Creed', model: 'Silver Mountain Water' },
        { brand: 'Juliette Has A Gun', model: 'Not A Perfume' },
        { brand: 'Maison Francis Kurkdjian', model: '724' }
    ],
    tropical_bundle: [
        { brand: 'Lorenzo Pazzaglia', model: 'Summer Hammer' },
        { brand: 'The Lab', model: 'MANGO WHITE' },
        { brand: 'Xerjoff', model: 'Erba Pura' },
        { brand: 'Nishane', model: 'Hacivat' },
        { brand: 'Simone Andreoli', model: 'Leisure in Paradise' },
        { brand: 'Tiziana Terenzi', model: 'Kirke' },
        { brand: 'Gritti', model: 'Pomelo Sorrento' },
        { brand: 'Maie Piou', model: 'MANGO STICKY RICE' },
        { brand: 'Imaginary Authors', model: 'IN LOVE WITH EVERYTHING' },
        { brand: 'Theodoros Kalotinis', model: 'Plini' }
    ],
    vanilla_bundle: [
        { brand: 'Maison Mataha', model: 'Escapade Gourmande' },
        { brand: 'Theodoros Kalotinis', model: 'Vanilla' },
        { brand: 'Montale', model: 'Sweet Vanilla' },
        { brand: 'Mancera', model: 'Coco Vanille' },
        { brand: 'Nishane', model: 'Ani' },
        { brand: 'Xerjoff', model: 'Lira' },
        { brand: 'Tiziana Terenzi', model: 'Delox' },
        { brand: 'Giardini Di Toscana', model: 'Bianco Latte' },
        { brand: 'The Lab', model: 'Vanille Noire' },
        { brand: 'Maison Francis Kurkdjian', model: 'Grand Soir' }
    ],
    gourmand_bundle: [
        { brand: 'Theodoros Kalotinis', model: 'Coffee Addict' },
        { brand: 'Montale', model: 'Chocolate Greedy' },
        { brand: 'Kilian', model: "Love Don't Be Shy" },
        { brand: 'Xerjoff', model: 'Italica' },
        { brand: 'Maison Francis Kurkdjian', model: 'PEACH MACAROON' },
        { brand: 'Kilian', model: 'MANGO STICKY RICE' },
        { brand: 'Theodoros Kalotinis', model: 'Halcyon Soma Parfums' },
        { brand: 'Lorenzo Pazzaglia', model: 'Van Py Rhum' },
        { brand: 'Simone Andreoli', model: 'Vicebomb' },
        { brand: 'Giardini Di Toscana', model: 'BoraBora' }
    ],
    citrus_bundle: [
        { brand: 'Xerjoff', model: 'Renaissance' },
        { brand: 'Nishane', model: 'Wulong Cha' },
        { brand: 'Theodoros Kalotinis', model: 'Colours Of Capri Birkholz' },
        { brand: 'Mancera', model: 'Lemon Line' },
        { brand: 'Roja', model: 'Elysium' },
        { brand: 'Creed', model: 'Aventus' },
        { brand: 'Simone Andreoli', model: 'Pacific Park' },
        { brand: 'Lorenzo Pazzaglia', model: 'Pax' },
        { brand: 'Acqua di Parma', model: 'Colonia' },
        { brand: 'Louis Vuitton', model: 'Afternoon Swim' }
    ]
};

async function run() {
    try {
        const bundlesConfig = {};
        for (const [bundleType, requirements] of Object.entries(BUNDLE_MAPPINGS)) {
            const foundIds = [];
            for (const req of requirements) {
                const res = await pool.query('SELECT id FROM products WHERE model ILIKE $1', ['%' + req.model + '%']);
                if (res.rows.length > 0) {
                    foundIds.push(res.rows[0].id);
                }
            }
            bundlesConfig[bundleType] = {
                type: bundleType,
                items: foundIds
            };
        }
        await pool.query(`
            INSERT INTO site_settings (key, value) 
            VALUES ('bundles_config', $1) 
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
        `, [JSON.stringify(bundlesConfig)]);
        console.log('Done!');
    } catch (e) {
        console.error(e);
    } finally {
        pool.end();
    }
}
run();
