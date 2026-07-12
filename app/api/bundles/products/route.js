import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
export const dynamic = 'force-dynamic';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const type = searchParams.get('type'); // summer, dates, collectors

        if (!type) {
            return NextResponse.json({ error: 'Type is required' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            let query = `
                SELECT id, name, brand, model, price_2ml, price_5ml, price_10ml, image_url, 
                       category, description, stock, seasons, brand_he, model_he, name_he,
                       discount_percentage, discount_sizes, discount_end_date
                FROM products 
                WHERE active = true AND stock > 0
            `;
            const values = [];

            if (['clean', 'tropical', 'vanilla', 'gourmand', 'citrus'].includes(type)) {
                const settingsRes = await client.query(`SELECT value FROM site_settings WHERE key = 'bundles_config'`);
                if (settingsRes.rows.length > 0) {
                    const config = settingsRes.rows[0].value;
                    const bundleConfig = Object.values(config).find(b => b.type === `${type}_bundle`);
                    if (bundleConfig && bundleConfig.items && bundleConfig.items.length > 0) {
                        query += ` AND id = ANY($1::int[])`;
                        values.push(bundleConfig.items);
                    } else {
                        return NextResponse.json({ products: [] });
                    }
                } else {
                    return NextResponse.json({ products: [] });
                }
            } else if (type === 'summer') {
                // Summer filter: 'קיץ' in seasons (stored as text or array, checking for both)
                query += ` AND (seasons ILIKE '%קיץ%' OR seasons ILIKE '%Summer%')`;
            } else if (type === 'winter') {
                // Winter filter: 'חורף' in seasons
                query += ` AND (seasons ILIKE '%חורף%' OR seasons ILIKE '%Winter%')`;
            } else if (type === 'collectors') {
                // Collectors filter: 'נדיר', 'לא מיוצר יותר', 'מהדורה מוגבלת'
                query += ` AND (category ILIKE '%נדיר%' OR category ILIKE '%לא מיוצר יותר%' OR category ILIKE '%מהדורה מוגבלת%' OR category ILIKE '%Rare%' OR category ILIKE '%Limited%')`;
            } else if (type === 'dates') {
                // Dates & Evening filter: 'דייט'/'Date' in description or 'ערב'/'Evening' in category
                query += ` AND (description ILIKE '%דייט%' OR description ILIKE '%דייטים%' OR description ILIKE '%Date%' OR category ILIKE '%ערב%' OR category ILIKE '%Evening%')`;
            }

            query += ' ORDER BY brand ASC, model ASC';

            const res = await client.query(query, values);
            return NextResponse.json({ products: res.rows });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Get Bundle Products Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
