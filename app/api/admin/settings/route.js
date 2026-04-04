import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { checkAdmin } from '@/app/lib/admin';

const DEFAULT_MENU = [
    { id: 'home', label: 'דף הבית', path: '/', visible: true, order: 1 },
    { id: 'brands', label: 'מותגים', path: '/brands', visible: true, order: 2 },
    { id: 'catalog', label: 'קטלוג', path: '/catalog', visible: true, order: 3 },
    { id: 'matching', label: 'התאמת מארזים', path: '/matching', visible: true, order: 4 },
    { id: 'requests', label: 'בקשת בשמים', path: '/requests', visible: true, order: 5 },
    { id: 'reviews', label: 'ביקורות', path: '/reviews', visible: true, order: 6 },
    { id: 'blog', label: 'בלוג', path: '/blog', visible: true, order: 7 },
    { id: 'lottery', label: 'הגרלה', path: '/lottery', visible: true, order: 8, isRed: true },
    { id: 'contact', label: 'צור קשר', path: '/contact', visible: true, order: 9 },
    { id: 'about', label: 'אודות', path: '/about', visible: true, order: 10 },
    { id: 'faq', label: 'שאלות נפוצות', path: '/faq', visible: true, order: 11 },
    { id: 'shipping', label: 'משלוחים', path: '/shipping', visible: true, order: 12 }
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
            
            let currentMenu = res.rows.length > 0 ? res.rows[0].value : [];
            
            // Merge logic: Ensure all default items exist in the database menu
            const currentIds = new Set(currentMenu.map(item => item.id));
            let updated = false;

            for (const defItem of DEFAULT_MENU) {
                if (!currentIds.has(defItem.id)) {
                    currentMenu.push(defItem);
                    updated = true;
                }
            }

            // If it's a fresh install or we found new items, sync back to DB
            if (res.rows.length === 0 || updated) {
                // Ensure order is maintained
                currentMenu.sort((a, b) => (a.order || 99) - (b.order || 99));
                
                await client.query(`
                    INSERT INTO site_settings (key, value)
                    VALUES ('main_menu', $1)
                    ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
                `, [JSON.stringify(currentMenu)]);
            }

            return NextResponse.json({ menu: currentMenu });
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
        const isAdmin = await checkAdmin();
        if (!isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }
        const { menu } = await req.json();

        const client = await pool.connect();
        try {
            await ensureTable(client);
            await client.query(`
                INSERT INTO site_settings (key, value)
                VALUES ('main_menu', $1)
                ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = CURRENT_TIMESTAMP
            `, [JSON.stringify(menu)]);

            return NextResponse.json({ success: true });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Update Settings Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
