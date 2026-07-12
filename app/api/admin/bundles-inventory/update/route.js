import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

export async function POST(req) {
    try {
        const isAdmin = await checkAdmin();
        if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });

        const { bundleId, oldProductId, newProductId } = await req.json();
        
        const client = await pool.connect();
        try {
            const settingsRes = await client.query(`SELECT value FROM site_settings WHERE key = 'bundles_config'`);
            let config = settingsRes.rows.length > 0 ? settingsRes.rows[0].value : {};
            
            if (config[bundleId]) {
                config[bundleId].items = config[bundleId].items.map(id => id === oldProductId ? newProductId : id);
                await client.query(`
                    INSERT INTO site_settings (key, value) 
                    VALUES ('bundles_config', $1) 
                    ON CONFLICT (key) DO UPDATE SET value = $1
                `, [JSON.stringify(config)]);
            }
            return NextResponse.json({ success: true, newConfig: config });
        } finally {
            client.release();
        }
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
