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
        scheduledDate: row.created_at, 
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
        scheduledDate: row.created_at,
        contentPreview: `הרשמה לעדכון חזרה למלאי: ${row.product_name}`,
        rawContent: null
    }));

    // Combine and sort
    const allPending = [...orderEmails, ...recEmails, ...campaigns, ...bisEmails].sort((a, b) => {
        const timeA = a.scheduledDate ? new Date(a.scheduledDate).getTime() : Infinity;
        const timeB = b.scheduledDate ? new Date(b.scheduledDate).getTime() : Infinity;
        return timeA - timeB;
    });

    // Ensure we send serializable dates
    const serializedPending = allPending.map(p => ({
        ...p,
        scheduledDate: p.scheduledDate ? new Date(p.scheduledDate).toISOString() : null
    }));

    return (
        <div className="min-h-screen">
            <h1 className="text-3xl font-bold mb-6 text-gray-800">מיילים בהמתנה</h1>
            <PendingEmailsClient initialEmails={serializedPending} />
        </div>
    );
}
