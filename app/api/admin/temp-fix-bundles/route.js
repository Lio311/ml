import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

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

export async function GET(req) {
    const client = await pool.connect();
    try {
        const settingsRes = await client.query(`SELECT value FROM site_settings WHERE key = 'bundles_config'`);
        let config = settingsRes.rows.length > 0 ? settingsRes.rows[0].value : {};
        if (typeof config === 'string') {
            try { config = JSON.parse(config); } catch (e) {}
        }

        let logs = [];

        for (const bundle of newBundles) {
            let itemIds = [];
            for (const itemName of bundle.items) {
                let searchStr = itemName;
                const res = await client.query(`SELECT id FROM products WHERE (name ILIKE $1 OR model ILIKE $1) AND active = true LIMIT 1`, [`%${searchStr}%`]);
                if (res.rows.length > 0) {
                    itemIds.push(res.rows[0].id);
                } else {
                    logs.push(`Could not find ${itemName}`);
                }
            }
            
            const key = Object.keys(config).find(k => config[k] && config[k].type === bundle.type);
            if (key) {
                config[key].items = itemIds;
                logs.push(`Updated existing ${bundle.type} with ${itemIds.length} items`);
            } else {
                config[bundle.type] = {
                    type: bundle.type,
                    items: itemIds
                };
                logs.push(`Created new ${bundle.type} with ${itemIds.length} items`);
            }
        }

        await client.query(`UPDATE site_settings SET value = $1 WHERE key = 'bundles_config'`, [JSON.stringify(config)]);
        
        return NextResponse.json({ success: true, logs });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    } finally {
        client.release();
    }
}
