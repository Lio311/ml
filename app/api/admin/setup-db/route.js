import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS site_settings (
                    id SERIAL PRIMARY KEY,
                    key VARCHAR(255) UNIQUE NOT NULL,
                    value JSONB NOT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Seed Menu Data
            const defaultMenu = [
                { id: 'home', label: 'דף הבית', path: '/', visible: true, order: 1 },
                { id: 'brands', label: 'מותגים', path: '/brands', visible: true, order: 2 },
                { id: 'catalog', label: 'קטלוג', path: '/catalog', visible: true, order: 3 },
                { id: 'matching', label: 'התאמת מארזים', path: '/matching', visible: true, order: 4 },
                { id: 'requests', label: 'בקשת בשמים', path: '/requests', visible: true, order: 5 },
                { id: 'lottery', label: 'הגרלה', path: '/lottery', visible: true, order: 6, isRed: true },
                { id: 'contact', label: 'צור קשר', path: '/contact', visible: true, order: 7 }
            ];

            await client.query(`
                INSERT INTO site_settings (key, value)
                VALUES ('main_menu', $1)
                ON CONFLICT (key) DO NOTHING
            `, [JSON.stringify(defaultMenu)]);

            return NextResponse.json({ message: "Database tables ('search_mappings', 'site_settings') created and seeded successfully." });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Setup DB Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
