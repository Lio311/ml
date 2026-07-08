import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { clerkClient } from '@clerk/nextjs/server';
import { sendEmail, getTemplate, getBatchPerfumeTemplate } from '@/app/lib/email';

export async function GET(req) {
    // Only allow cron requests
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
        // Find if there is any un-emailed perfume older than 1 hour
        const oldestRes = await client.query(`
            SELECT id, created_at 
            FROM products 
            WHERE is_discovery_set = false AND perfume_email_sent = false AND active = true
            ORDER BY created_at ASC
            LIMIT 1
        `);

        if (oldestRes.rows.length === 0) {
            return NextResponse.json({ message: 'No new perfumes found.' });
        }

        const oldestPerfume = oldestRes.rows[0];
        const ageInMs = Date.now() - new Date(oldestPerfume.created_at).getTime();
        const oneHourInMs = 60 * 60 * 1000;

        if (ageInMs < oneHourInMs) {
            return NextResponse.json({ message: 'Oldest new perfume is less than 1 hour old. Waiting.' });
        }

        // It has been 1 hour! Let's fetch ALL un-emailed perfumes
        const batchRes = await client.query(`
            SELECT id, brand, model, image_url, single_price, price_2ml, price_5ml, price_10ml, description, slug 
            FROM products 
            WHERE is_discovery_set = false AND perfume_email_sent = false AND active = true
            ORDER BY created_at ASC
        `);

        const newPerfumes = batchRes.rows;
        if (newPerfumes.length === 0) {
            return NextResponse.json({ message: 'No new perfumes to email.' });
        }

        const batchIds = newPerfumes.map(p => p.id);

        // Fetch users
        const clerk = await clerkClient();
        const { data: users } = await clerk.users.getUserList({ limit: 500 });

        const emails = users
            .map(u => u.emailAddresses.find(e => e.id === u.primaryEmailAddressId)?.emailAddress || u.emailAddresses[0]?.emailAddress)
            .filter(Boolean);

        if (emails.length > 0) {
            let html, subject;
            let finalSubject = '';

            if (newPerfumes.length === 1) {
                // Just one perfume, use the existing single product format
                const tpl = await getTemplate('new_product', {
                    brand: newPerfumes[0].brand || '',
                    model: newPerfumes[0].model || '',
                    description: newPerfumes[0].description || '',
                    price_2ml: newPerfumes[0].price_2ml || '',
                    price_5ml: newPerfumes[0].price_5ml || '',
                    price_10ml: newPerfumes[0].price_10ml || '',
                    imageUrl: newPerfumes[0].image_url || 'https://www.ml-tlv.com/logo-black.png',
                    productId: newPerfumes[0].id
                });
                html = tpl.html;
                finalSubject = tpl.subject || `חדש באתר: ${newPerfumes[0].brand} ${newPerfumes[0].model} 🌟 - ml_tlv`;
            } else {
                // Multiple perfumes, use the new batch template
                const tpl = await getTemplate('new_perfumes_batch', null, () => getBatchPerfumeTemplate(newPerfumes));
                html = tpl.html;
                finalSubject = tpl.subject || 'בשמים חדשים נחתו באתר! ✨ - ml_tlv';
            }

            // Send emails via BCC
            await sendEmail(emails, finalSubject, html, 'new_perfumes_batch');
            console.log(`Perfume batch newsletter sent to ${emails.length} recipients for ${newPerfumes.length} products.`);

            // Mark as sent
            await client.query(`
                UPDATE products 
                SET perfume_email_sent = true 
                WHERE id = ANY($1)
            `, [batchIds]);
        }

        return NextResponse.json({ success: true, count: newPerfumes.length });
    } catch (error) {
        console.error('Error in new perfumes cron:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
