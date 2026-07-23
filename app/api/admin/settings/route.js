import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

const DEFAULT_MENU = [
    { id: 'home', label: 'דף הבית', path: '/', visible: true, order: 1 },
    { id: 'brands', label: 'מותגים', path: '/brands', visible: true, order: 2 },
    { id: 'catalog', label: 'קטלוג', path: '/catalog', visible: true, order: 3 },
    { id: 'bundles', label: 'חבילות', path: '/bundles', visible: true, order: 4 },
    { id: 'discovery_sets', label: 'דיסקברי סט', path: '/discovery-sets', visible: true, order: 5 },
    { id: 'sales', label: 'מבצעים', path: '/sales', visible: true, order: 6 },
    { id: 'requests', label: 'בקשת בשמים', path: '/requests', visible: true, order: 8 },
    { id: 'lottery', label: 'הגרלה', path: '/lottery', visible: true, order: 9, isRed: true },
    { id: 'contact', label: 'צור קשר', path: '/contact', visible: true, order: 10 }
];

async function ensureTable(client) {
    await client.query(`
        CREATE TABLE IF NOT EXISTS site_settings (
            id SERIAL PRIMARY KEY,
            key VARCHAR(255) UNIQUE NOT NULL,
            value JSONB NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            await ensureTable(client);
            const res = await client.query("SELECT value FROM site_settings WHERE key = 'main_menu'");
            const resFeatures = await client.query("SELECT value FROM site_settings WHERE key = 'features'");
            
            let currentMenu = res.rows.length > 0 ? res.rows[0].value : [];
            let currentFeatures = resFeatures.rows.length > 0 ? resFeatures.rows[0].value : { enable_personal_catalogs: true };
            
            // Merge & Purge logic: 
            // 1. Remove items that are NOT in DEFAULT_MENU (at least according to user request "should not appear there")
            const defaultIds = new Set(DEFAULT_MENU.map(item => item.id));
            let filteredMenu = currentMenu.filter(item => defaultIds.has(item.id));
            
            let updated = filteredMenu.length !== currentMenu.length;
            
            // 2. Ensure all default items exist and have correct order/labels
            for (const defItem of DEFAULT_MENU) {
                const existing = filteredMenu.find(item => item.id === defItem.id);
                if (existing) {
                    if (existing.order !== defItem.order || existing.label !== defItem.label) {
                        existing.order = defItem.order;
                        existing.label = defItem.label;
                        updated = true;
                    }
                } else {
                    filteredMenu.push(defItem);
                    updated = true;
                }
            }

            // Sync back to DB if needed
            if (res.rows.length === 0 || updated) {
                filteredMenu.sort((a, b) => (a.order || 99) - (b.order || 99));
                
                await client.query(`
                    INSERT INTO site_settings (key, value)
                    VALUES ('main_menu', $1)
                    ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
                `, [JSON.stringify(filteredMenu)]);
                
                currentMenu = filteredMenu;
            }

            return NextResponse.json({ menu: currentMenu, features: currentFeatures });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Fetch Settings Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req) {
    try {
        const isAdmin = await checkAdmin({ allowViewer: true });
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const body = await req.json();

        const client = await pool.connect();
        try {
            await ensureTable(client);
            if (body.menu) {
                await client.query(`
                    INSERT INTO site_settings (key, value)
                    VALUES ('main_menu', $1)
                    ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
                `, [JSON.stringify(body.menu)]);
            }
            if (body.features) {
                await client.query(`
                    INSERT INTO site_settings (key, value)
                    VALUES ('features', $1)
                    ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
                `, [JSON.stringify(body.features)]);
            }

            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update Settings Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
