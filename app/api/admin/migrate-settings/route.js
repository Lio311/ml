import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import pool from '../../../lib/db';

export async function POST(req) {
    try {
        const { userId } = await auth();

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Create settings table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS settings (
                id SERIAL PRIMARY KEY,
                key VARCHAR(255) UNIQUE NOT NULL,
                value JSONB NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        // Insert menu configuration
        await pool.query(`
            INSERT INTO settings (key, value) VALUES (
                'menu',
                $1::jsonb
            )
            ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP
        `, [JSON.stringify([
            { id: 1, label: "מותגים", path: "/brands", order: 1, isDropdown: true },
            { id: 2, label: "קטגוריות", path: "/categories", order: 2 },
            { id: 3, label: "הגרלת בשמים", path: "/lottery", order: 3, isRed: true },
            { id: 4, label: "התאמת מארזים", path: "/matching", order: 4 },
            { id: 5, label: "אודות", path: "/about", order: 5 },
            { id: 6, label: "צור קשר", path: "/contact", order: 6 }
        ])]);

        // Create index
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key)
        `);

        return NextResponse.json({
            success: true,
            message: 'Settings table created and menu populated successfully'
        });

    } catch (error) {
        console.error('Migration error:', error);
        return NextResponse.json({
            error: error.message || 'Migration failed'
        }, { status: 500 });
    }
}
