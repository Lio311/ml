import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { clerkClient } from '@clerk/nextjs/server';
import { sendEmail, getTemplate, getBatchPerfumeItemsHtml, getDiscoveryBatchItemsHtml, getSystemDefaults } from '@/app/lib/email';

export async function GET(req) {
    // Only allow cron requests
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV !== 'development') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
        // --- 0. Shabbat Check ---
        const israelTime = new Date().toLocaleString("en-US", {timeZone: "Asia/Jerusalem"});
        const israelDate = new Date(israelTime);
        if (israelDate.getDay() === 6) {
            return NextResponse.json({ message: 'No marketing emails on Saturday (Shabbat).' });
        }

        // --- 1. Rate Limiting Check ---
        const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
        const settingsRes = await client.query(`SELECT value FROM site_settings WHERE key = 'last_marketing_email_date'`);
        const lastSentDate = settingsRes.rows.length > 0 ? settingsRes.rows[0].value : null;

        if (lastSentDate === todayStr) {
            return NextResponse.json({ message: 'A marketing email was already sent today. Deferring to tomorrow.' });
        }

        let emailSent = false;
        let sentCount = 0;
        let actionTaken = '';

        // --- 2. Check for New Perfumes (Priority 1: Batch, Priority 2: Single) ---
        const perfumesRes = await client.query(`
            SELECT id, brand, model, image_url, single_price, price_2ml, price_5ml, price_10ml, description, slug 
            FROM products 
            WHERE is_discovery_set = false AND perfume_email_sent = false AND active = true
            ORDER BY created_at ASC
        `);
        const newPerfumes = perfumesRes.rows;

        // Fetch users
        const clerk = await clerkClient();
        const { data: users } = await clerk.users.getUserList({ limit: 500 });
        const emails = users
            .map(u => u.emailAddresses.find(e => e.id === u.primaryEmailAddressId)?.emailAddress || u.emailAddresses[0]?.emailAddress)
            .filter(Boolean);

        if (emails.length > 0 && newPerfumes.length > 0) {
            let html, subject;
            let finalSubject = '';
            
            // Limit to a maximum of 6 new perfumes per email
            const batchToEmail = newPerfumes.slice(0, 6);
            const batchIds = batchToEmail.map(p => p.id);

            if (batchToEmail.length === 1) {
                // Priority 2: Single Perfume
                const tpl = await getTemplate('new_product', {
                    brand: batchToEmail[0].brand || '',
                    model: batchToEmail[0].model || '',
                    description: batchToEmail[0].description || '',
                    price_2ml: batchToEmail[0].price_2ml || '',
                    price_5ml: batchToEmail[0].price_5ml || '',
                    price_10ml: batchToEmail[0].price_10ml || '',
                    imageUrl: batchToEmail[0].image_url || 'https://www.ml-tlv.com/logo-black.png',
                    productId: batchToEmail[0].id
                });
                html = tpl.html;
                finalSubject = tpl.subject || `חדש באתר: ${batchToEmail[0].brand} ${batchToEmail[0].model} 🌟 - ml_tlv`;
                actionTaken = 'sent_single_perfume';
            } else {
                // Priority 1: Batch of Perfumes (2 to 6)
                const itemsHtml = getBatchPerfumeItemsHtml(batchToEmail);
                const tpl = await getTemplate('new_perfumes_batch', { itemsHtml }, () => {
                    const defaultTplHtml = getSystemDefaults()['new_perfumes_batch'].content_html;
                    return defaultTplHtml.replace('{{itemsHtml}}', itemsHtml);
                });
                html = tpl.html;
                finalSubject = tpl.subject || 'בשמים חדשים נחתו באתר! ✨ - ml_tlv';
                actionTaken = 'sent_perfumes_batch';
            }

            await sendEmail(emails, finalSubject, html, 'new_perfumes_batch');
            console.log(`Perfume newsletter sent to ${emails.length} recipients for ${newPerfumes.length} products.`);

            await client.query(`
                UPDATE products 
                SET perfume_email_sent = true 
                WHERE id = ANY($1)
            `, [batchIds]);
            
            emailSent = true;
            sentCount = newPerfumes.length;
        }

        // --- 3. Check for Discovery Sets (Priority 3) ---
        // Only if no perfume email was sent today!
        if (!emailSent && emails.length > 0) {
            const discoveryRes = await client.query(`
                SELECT id, brand, model, image_url, single_price, price_2ml, slug 
                FROM products 
                WHERE is_discovery_set = true AND discovery_email_sent = false AND active = true
                ORDER BY created_at ASC
            `);
            const newSets = discoveryRes.rows;

            if (newSets.length >= 6) {
                const batchToEmail = newSets.slice(0, 6);
                const batchIds = batchToEmail.map(p => p.id);

                const itemsHtml = getDiscoveryBatchItemsHtml(batchToEmail);
                const { html, subject } = await getTemplate('new_discovery_sets', { itemsHtml }, () => {
                    const defaultTplHtml = getSystemDefaults()['new_discovery_sets'].content_html;
                    return defaultTplHtml.replace('{{itemsHtml}}', itemsHtml);
                });
                const finalSubject = subject || 'השקנו 6 מארזי דיסקברי חדשים! ✨ - ml_tlv';

                await sendEmail(emails, finalSubject, html, 'new_discovery_sets');
                console.log(`Discovery batch newsletter sent to ${emails.length} recipients.`);

                await client.query(`
                    UPDATE products 
                    SET discovery_email_sent = true 
                    WHERE id = ANY($1)
                `, [batchIds]);

                emailSent = true;
                sentCount = 6;
                actionTaken = 'sent_discovery_sets';
            }
        }

        // --- 4. Update Rate Limit Record ---
        if (emailSent) {
            await client.query(`
                INSERT INTO site_settings (key, value) 
                VALUES ('last_marketing_email_date', $1)
                ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
            `, [JSON.stringify([todayStr])]);
        }

        return NextResponse.json({ 
            success: true, 
            emailSent, 
            actionTaken, 
            count: sentCount,
            message: emailSent ? `Sent ${actionTaken} today.` : 'No emails pending.'
        });
    } catch (error) {
        console.error('Error in marketing cron:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
