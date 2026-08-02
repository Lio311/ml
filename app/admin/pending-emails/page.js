import pool from "../../lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import PendingEmailsClient from "./PendingEmailsClient";

export const dynamic = 'force-dynamic';

export default async function PendingEmailsPage() {
    let user = null;
    try {
        user = await currentUser();
    } catch (err) {
        console.error("Auth Error:", err);
        redirect("/");
    }

    const email = user?.emailAddresses?.[0]?.emailAddress;
    const adminEmail = process.env.ADMIN_EMAIL;
    const isSuperAdmin = email === adminEmail;
    
    // Allow admins
    if (!isSuperAdmin) {
        redirect("/admin");
    }

    // 1. Fetch pending order emails (review requests, follow ups)
    const orderEmailsRes = await pool.query(`
        SELECT 
            poe.order_id, poe.process_at, poe.created_at, poe.initial_status,
            o.customer_details->>'email' as recipient, 
            o.customer_details->>'name' as customer_name
        FROM pending_order_emails poe
        JOIN orders o ON o.id = poe.order_id
        WHERE poe.initial_status = 'pending'
        ORDER BY poe.process_at ASC
    `);

    const orderEmails = orderEmailsRes.rows.map(row => ({
        id: `order_${row.order_id}_${new Date(row.created_at || Date.now()).getTime()}`,
        type: 'פולו-אפ להזמנה / סקירה',
        recipient: row.recipient,
        customerName: row.customer_name,
        scheduledDate: row.process_at,
        contentPreview: `מייל מעקב להזמנה #${row.order_id}`,
        rawContent: null
    }));

    // 2. Fetch pending/approved recommendation emails
    const recEmailsRes = await pool.query(`
        SELECT 
            pre.id, pre.created_at, pre.suggested_products, pre.status,
            u.email as recipient, u.first_name, u.last_name
        FROM pending_recommendation_emails pre
        LEFT JOIN users u ON u.id = pre.user_id
        WHERE pre.status IN ('pending', 'approved')
        ORDER BY pre.created_at ASC
    `);

    const recEmails = recEmailsRes.rows.map(row => ({
        id: `rec_${row.id}`,
        type: row.status === 'approved' ? 'המלצות (מאושר, ממתין לשליחה)' : 'המלצות אישיות (ממתין לאישור)',
        recipient: row.recipient || 'לא ידוע',
        customerName: `${row.first_name || ''} ${row.last_name || ''}`.trim(),
        scheduledDate: null, // Event-based, no specific scheduled date
        contentPreview: `מכיל ${row.suggested_products?.length || 0} המלצות בשמים`,
        rawContent: JSON.stringify(row.suggested_products, null, 2)
    }));

    // 3. Fetch scheduled email campaigns
    const campaignsRes = await pool.query(`
        SELECT 
            id, title, subject, scheduled_at, recipient_type, recipients, content_html
        FROM email_campaigns
        WHERE status = 'scheduled'
        ORDER BY scheduled_at ASC
    `);

    const campaigns = campaignsRes.rows.map(row => {
        let recipientDisplay = row.recipient_type;
        if (row.recipient_type === 'specific') {
            recipientDisplay = `רשימה ספציפית (${row.recipients?.length || 0} נמענים)`;
        } else if (row.recipient_type === 'all') {
            recipientDisplay = 'כלל המנויים';
        }

        return {
            id: `campaign_${row.id}`,
            type: 'קמפיין דיוור',
            recipient: recipientDisplay,
            customerName: row.title || 'ללא כותרת',
            scheduledDate: row.scheduled_at,
            contentPreview: row.subject,
            rawContent: row.content_html
        };
    });

    // 4. Fetch back in stock subscriptions
    const bisRes = await pool.query(`
        SELECT 
            b.id, b.created_at, b.user_email as recipient,
            p.name as product_name
        FROM back_in_stock_subscriptions b
        LEFT JOIN products p ON p.id = b.product_id
        WHERE b.status = 'pending'
    `);

    const bisEmails = bisRes.rows.map(row => ({
        id: `bis_${row.id}`,
        type: 'חזר למלאי (ממתין)',
        recipient: row.recipient,
        customerName: '-',
        scheduledDate: null, // Event-based
        contentPreview: `הרשמה לעדכון חזרה למלאי: ${row.product_name}`,
        rawContent: null
    }));

    // 5. Fetch last marketing email date
    const settingsRes = await pool.query(`SELECT value FROM site_settings WHERE key = 'last_marketing_email_date'`);
    let lastSentDateStr = null;
    if (settingsRes.rows.length > 0) {
        try {
            // It might be stored as JSON array string '["2023-10-25"]' or simple string
            const val = settingsRes.rows[0].value;
            if (val.startsWith('[')) {
                lastSentDateStr = JSON.parse(val)[0];
            } else {
                lastSentDateStr = val;
            }
        } catch (e) {
            lastSentDateStr = settingsRes.rows[0].value;
        }
    }

    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jerusalem' });
    const skipSaturdays = (dateObj) => {
        const israelTime = dateObj.toLocaleString("en-US", {timeZone: "Asia/Jerusalem"});
        const israelDate = new Date(israelTime);
        if (israelDate.getDay() === 6) { // 6 = Saturday
            dateObj.setDate(dateObj.getDate() + 1);
        }
    };

    let nextAvailableDate = new Date();
    if (lastSentDateStr === todayStr) {
        // Already sent today, next available is tomorrow at 10:00 UTC
        nextAvailableDate = new Date();
        nextAvailableDate.setUTCDate(nextAvailableDate.getUTCDate() + 1);
        nextAvailableDate.setUTCHours(10, 0, 0, 0);
    } else {
        // Next available is today at 10:00 UTC if it hasn't passed, otherwise tomorrow at 10:00 UTC
        const today10amUTC = new Date();
        today10amUTC.setUTCHours(10, 0, 0, 0);
        
        if (new Date() > today10amUTC) {
            nextAvailableDate = new Date();
            nextAvailableDate.setUTCDate(nextAvailableDate.getUTCDate() + 1);
            nextAvailableDate.setUTCHours(10, 0, 0, 0);
        } else {
            nextAvailableDate = today10amUTC;
        }
    }
    
    skipSaturdays(nextAvailableDate);

    // 6. Implicit Marketing Emails (New Perfumes & Discovery Sets)
    const perfumesRes = await pool.query(`
        SELECT id, brand, model, is_discovery_set
        FROM products 
        WHERE active = true 
          AND ((is_discovery_set = false AND perfume_email_sent = false)
           OR (is_discovery_set = true AND discovery_email_sent = false))
        ORDER BY created_at ASC
    `);

    const newPerfumes = perfumesRes.rows.filter(p => !p.is_discovery_set);
    const newSets = perfumesRes.rows.filter(p => p.is_discovery_set);
    const productEmails = [];

    let currentAvailableDate = new Date(nextAvailableDate);

    if (newPerfumes.length > 0) {
        let perfumesRemaining = [...newPerfumes];
        let batchIndex = 1;
        
        while (perfumesRemaining.length > 0) {
            const currentBatch = perfumesRemaining.slice(0, 6);
            perfumesRemaining = perfumesRemaining.slice(6);
            
            productEmails.push({
                id: `new_perfumes_pending_${batchIndex}`,
                type: 'קמפיין בשמים חדשים',
                recipient: 'כלל המנויים',
                customerName: '-',
                scheduledDate: currentAvailableDate.toISOString(),
                contentPreview: `מוכן לשליחה: מכיל ${currentBatch.length} בשמים חדשים`,
                rawContent: JSON.stringify(currentBatch.map(p => `${p.brand} ${p.model}`), null, 2)
            });
            
            // Push the available date for the next campaign by 1 day
            currentAvailableDate.setDate(currentAvailableDate.getDate() + 1);
            skipSaturdays(currentAvailableDate);
            batchIndex++;
        }
    }

    if (newSets.length > 0) {
        let setsRemaining = [...newSets];
        let batchIndex = 1;

        while (setsRemaining.length > 0) {
            const currentBatch = setsRemaining.slice(0, 6);
            setsRemaining = setsRemaining.slice(6);
            
            const isFullBatch = currentBatch.length === 6;
            const missing = 6 - currentBatch.length;
            
            const previewText = !isFullBatch
                ? `חסרים ${missing} מארזים כדי לשלוח (יש ${currentBatch.length} מתוך 6)` 
                : `מוכן לשליחה (מכיל 6 מארזים)`;
                
            productEmails.push({
                id: `new_discovery_pending_${batchIndex}`,
                type: 'קמפיין מארזי דיסקברי',
                recipient: 'כלל המנויים',
                customerName: '-',
                scheduledDate: !isFullBatch ? null : new Date(currentAvailableDate).toISOString(),
                contentPreview: previewText,
                rawContent: JSON.stringify(currentBatch.map(p => `${p.brand} ${p.model}`), null, 2)
            });
            
            if (isFullBatch) {
                // Push the available date for the next campaign by 1 day
                currentAvailableDate.setDate(currentAvailableDate.getDate() + 1);
                skipSaturdays(currentAvailableDate);
            }
            batchIndex++;
        }
    }

    // Combine and sort
    const now = Date.now();
    const allPending = [...orderEmails, ...recEmails, ...campaigns, ...bisEmails, ...productEmails]
        .filter(p => {
            if (!p.scheduledDate) return true;
            return new Date(p.scheduledDate).getTime() > now - (1000 * 60 * 60); // Allow up to 1 hour past
        })
        .sort((a, b) => {
            const timeA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : Infinity;
            const timeB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : Infinity;
            return timeA - timeB;
        });

    // Ensure we send serializable dates
    const serializedPending = allPending.map(p => ({
        ...p,
        scheduledDate: p.scheduledDate ? new Date(p.scheduledDate).toISOString() : null
    }));

    // 7. Fetch Shabbat queued emails
    const shabbatRes = await pool.query(`
        SELECT id, recipient, subject, type, created_at, order_id, campaign_id, html
        FROM queued_shabbat_emails
        WHERE status = 'pending'
        ORDER BY created_at ASC
    `);

    const shabbatEmails = shabbatRes.rows.map(row => ({
        id: `shabbat_${row.id}`,
        type: `ממתין למוצ"ש (${row.type})`,
        recipient: row.recipient,
        customerName: row.order_id ? `הזמנה #${row.order_id}` : (row.campaign_id ? `קמפיין #${row.campaign_id}` : '-'),
        scheduledDate: null,
        contentPreview: row.subject,
        rawContent: row.html,
        isShabbatQueued: true
    }));

    return (
        <div className="min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">מיילים בהמתנה</h1>
            <PendingEmailsClient initialEmails={serializedPending} initialShabbatEmails={shabbatEmails} />
        </div>
    );
}
