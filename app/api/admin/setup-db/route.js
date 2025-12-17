import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';

export async function GET() {
    try {
        const client = await pool.connect();
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS search_mappings (
                    id SERIAL PRIMARY KEY,
                    hebrew_term VARCHAR(255) UNIQUE NOT NULL,
                    english_term VARCHAR(255) NOT NULL,
                    type VARCHAR(50) DEFAULT 'general',
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Seed Data
            const initialMappings = {
                // Brands
                'שאנל': 'Chanel', 'דיור': 'Dior', 'קריד': 'Creed', 'טום פורד': 'Tom Ford',
                'אמוואג': 'Amouage', 'אמוואז': 'Amouage', 'אמואג': 'Amouage',
                'פרפום דה מארלי': 'Parfums de Marly', 'מארלי': 'Marly', 'מרלי': 'Marly',
                'רוזה': 'Roja', 'רוז׳ה': 'Roja', 'רוג׳ה': 'Roja',
                'זייר': 'Xerjoff', 'קסרג׳וף': 'Xerjoff', 'קסרגוף': 'Xerjoff', 'זרגוף': 'Xerjoff', 'זרג׳וף': 'Xerjoff',
                'נרסיסו': 'Narciso', 'נרסיסו רודריגז': 'Narciso Rodriguez',
                'גוצי': 'Gucci', 'גוצ׳י': 'Gucci',
                'איב סאן לורן': 'Yves Saint Laurent', 'ysl': 'Yves Saint Laurent',
                'הרמס': 'Hermes', 'ארמני': 'Armani', 'ורסאצ׳ה': 'Versace', 'ורסאצה': 'Versace',
                'מונט דייל': 'Montale', 'מונטל': 'Montale',
                'מייזון': 'Maison', 'פרנסיס': 'Francis', 'קורקדג׳יאן': 'Kurkdjian', 'קורקדיאן': 'Kurkdjian',
                'בקרט': 'Baccarat', 'רוז': 'Rouge',
                'אוונטוס': 'Aventus', 'סאווג': 'Sauvage', 'סוואג': 'Sauvage',
                'בלו': 'Bleu', 'שאנל בלו': 'Bleu de Chanel',
                'אלי': 'Elysium', 'אליסיום': 'Elysium',
                'הרוד': 'Herod', 'לייטון': 'Layton', 'דלינה': 'Delina', 'פגסוס': 'Pegasus',
                'קיליין': 'Kilian', 'קיליאן': 'Kilian',
                'אינישיו': 'Initio', 'נישנה': 'Nishane', 'נישאנה': 'Nishane',
                'ממו': 'Memo', 'בי י די קיי': 'BDK', 'בי די קיי': 'BDK', 'בידיקיי': 'BDK',
                'גולדפילד': 'Goldfield', 'בנקס': 'Banks',
                // General
                'בושם': 'Perfume', 'דוגמית': 'Sample', 'יוניסקס': 'Unisex',
                'גבר': 'Men', 'אישה': 'Women', 'נשים': 'Women', 'גברים': 'Men'
            };

            for (const [hebrew, english] of Object.entries(initialMappings)) {
                await client.query(`
                    INSERT INTO search_mappings (hebrew_term, english_term)
                    VALUES ($1, $2)
                    ON CONFLICT (hebrew_term) DO NOTHING
                `, [hebrew, english]);
            }
            
            return NextResponse.json({ message: "Table 'search_mappings' created and seeded successfully." });
        } finally {
            client.release();
        }
    } catch (error) {
        console.error("Setup DB Error:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
