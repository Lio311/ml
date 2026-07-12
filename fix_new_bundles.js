const { Pool } = require('pg');
const pool = new Pool({connectionString: 'postgresql://neondb_owner:npg_7r2XpDcfwGih@ep-jolly-hat-a2t6ndp5-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require'});

const newBundles = [
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

async function fix() {
    const client = await pool.connect();
    try {
        const settingsRes = await client.query(`SELECT value FROM site_settings WHERE key = 'bundles_config'`);
        let config = settingsRes.rows[0].value;

        for (const bundle of newBundles) {
            let itemIds = [];
            for (const itemName of bundle.items) {
                let searchStr = itemName;
                let res = await client.query(`SELECT id FROM products WHERE name ILIKE $1 OR model ILIKE $1 LIMIT 1`, [`%${searchStr}%`]);
                if (res.rows.length > 0) {
                    itemIds.push(res.rows[0].id);
                } else {
                    console.log(`Could not find ${itemName}`);
                }
            }
            
            // update config
            const key = Object.keys(config).find(k => config[k].type === bundle.type);
            if (key) {
                config[key].items = itemIds;
                console.log(`Updated ${bundle.type} with ${itemIds.length} items:`, itemIds);
            }
        }

        await client.query(`UPDATE site_settings SET value = $1 WHERE key = 'bundles_config'`, [config]);
        console.log("Done!");
    } finally {
        client.release();
        pool.end();
    }
}
fix();
