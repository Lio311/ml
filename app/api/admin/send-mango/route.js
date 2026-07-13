import { NextResponse } from 'next/server';
import { sendEmail, getNewPreorderTemplate } from '@/app/lib/email';
import pool from '@/app/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'lior31197@gmail.com';
        const data = {
            brand: 'BORNTOSTANDOUT',
            model: 'Black Mango',
            image_url: 'https://www.ml-tlv.com/logo-black.png', 
            price_2ml: '180',
            slug: 'black-mango'
        };
        
        const client = await pool.connect();
        try {
            const res = await client.query("SELECT * FROM products WHERE name ILIKE '%mango%' OR model ILIKE '%mango%' LIMIT 1");
            if (res.rows.length > 0) {
                const p = res.rows[0];
                data.brand = p.brand;
                data.model = p.model;
                data.image_url = p.image_url;
                data.imageUrl = p.image_url;
                data.price_2ml = p.price_2ml || p.price;
                data.slug = p.slug;
                data.id = p.id;
            }
        } finally {
            client.release();
        }

        const html = getNewPreorderTemplate(data);
        const subject = `🆕 חדש באתר: ${data.brand} ${data.model}`;
        
        await sendEmail(adminEmail, subject, html, 'marketing');
        
        return NextResponse.json({ success: true, message: `Email sent to ${adminEmail}` });
    } catch (e) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}
