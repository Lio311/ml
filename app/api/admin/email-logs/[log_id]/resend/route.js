import pool from '@/app/lib/db';
import { sendEmail, getOrderConfirmationTemplate, formatItemsHtmlCustomer, formatNotesHtml } from '@/app/lib/email';
import { currentUser } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function POST(req, { params }) {
    try {
        const { log_id } = await params;

        // Admin Auth Check
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const adminEmail = user?.emailAddresses[0]?.emailAddress;
        
        if (role !== 'admin' && adminEmail !== process.env.ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch log
        const logRes = await pool.query(`SELECT * FROM email_logs WHERE id = $1`, [log_id]);
        if (logRes.rows.length === 0) {
            return NextResponse.json({ error: 'Log not found' }, { status: 404 });
        }
        const log = logRes.rows[0];

        let html = '';
        const subject = log.subject;
        const recipient = log.recipient.split(',').map(e => e.trim()); // Could be multiple? Send to original recipient.
        // Wait, sendEmail logic will automatically expand to secondary email if we pass the primary email!
        // We'll just pass the primary email from the log.

        if (log.type === 'campaign' || log.type === 'manual_campaign') {
            if (!log.campaign_id) return NextResponse.json({ error: 'Campaign ID missing for campaign email' }, { status: 400 });
            const campaignRes = await pool.query(`SELECT html_content FROM campaigns WHERE id = $1`, [log.campaign_id]);
            if (campaignRes.rows.length === 0) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
            html = campaignRes.rows[0].html_content;
        } else if (log.type === 'order_confirmation') {
            if (!log.order_id) return NextResponse.json({ error: 'Order ID missing' }, { status: 400 });
            const orderRes = await pool.query(`SELECT * FROM orders WHERE id = $1`, [log.order_id]);
            if (orderRes.rows.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            
            const order = orderRes.rows[0];
            const items = order.items;
            const itemsHtml = formatItemsHtmlCustomer(items);
            const notesHtml = formatNotesHtml(order.notes);
            
            let deliveryMethodText = 'משלוח לנקודת חלוקה';
            let shippingCostText = '0';
            if (order.shipping_details?.deliveryMethod === 'courier') {
                deliveryMethodText = 'שליח עד הבית';
                shippingCostText = '35';
            }

            html = getOrderConfirmationTemplate(
                order.id, 
                itemsHtml, 
                order.total_amount, 
                0, // freeSamples
                notesHtml, 
                deliveryMethodText, 
                shippingCostText
            );
        } else if (log.type === 'order_update') {
            if (!log.order_id) return NextResponse.json({ error: 'Order ID missing' }, { status: 400 });
            const orderRes = await pool.query(`SELECT * FROM orders WHERE id = $1`, [log.order_id]);
            if (orderRes.rows.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            
            const order = orderRes.rows[0];
            const items = order.items;
            const notesHtml = formatNotesHtml(order.notes);
            
            let deliveryMethodText = 'משלוח לנקודת חלוקה';
            let shippingCostText = '0';
            if (order.shipping_details?.deliveryMethod === 'courier') {
                deliveryMethodText = 'שליח עד הבית';
                shippingCostText = '35';
            }

            const { getOrderUpdatedTemplate } = require('@/app/lib/email');
            const name = order.customer_details?.firstName || 'לקוח';

            html = getOrderUpdatedTemplate(
                order.id, 
                name, 
                items, 
                order.total_amount, 
                deliveryMethodText, 
                shippingCostText, 
                notesHtml
            );
        } else if (log.type === 'status_update') {
            if (!log.order_id) return NextResponse.json({ error: 'Order ID missing' }, { status: 400 });
            const orderRes = await pool.query(`SELECT * FROM orders WHERE id = $1`, [log.order_id]);
            if (orderRes.rows.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            
            const order = orderRes.rows[0];
            const { getStatusUpdateTemplate } = require('@/app/lib/email');
            const name = order.customer_details?.firstName || 'לקוח';
            
            html = getStatusUpdateTemplate(
                order.id,
                name,
                order.status,
                '' // messageBody we might not have it exactly as it was, but we resend the status update
            );
        } else if (log.type === 'cart_recovery') {
            if (!log.order_id) return NextResponse.json({ error: 'Order ID missing' }, { status: 400 });
            const orderRes = await pool.query(`SELECT * FROM orders WHERE id = $1`, [log.order_id]);
            if (orderRes.rows.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            
            const order = orderRes.rows[0];
            const items = order.items || [];
            
            let deliveryMethodText = 'משלוח לנקודת חלוקה';
            let shippingCostText = '0';
            if (order.shipping_details?.deliveryMethod === 'courier') {
                deliveryMethodText = 'שליח עד הבית';
                shippingCostText = '35';
            }

            const { formatItemsHtmlCustomer, formatNotesHtml } = require('@/app/lib/email');
            // Assuming there is a generic way to resend abandoned cart, or we fallback to order update for display
            // But if getAbandonedCartTemplate is missing, we might fail. Let's try to just require it if it exists.
            const { getAbandonedCartTemplate, getOrderUpdatedTemplate } = require('@/app/lib/email');
            
            const itemsHtml = formatItemsHtmlCustomer(items);
            const notesHtml = formatNotesHtml(order.notes);
            
            if (getAbandonedCartTemplate) {
                html = getAbandonedCartTemplate(order.id, itemsHtml, order.total_amount, deliveryMethodText, shippingCostText, notesHtml);
            } else {
                html = getOrderUpdatedTemplate(order.id, order.customer_details?.firstName || 'לקוח', items, order.total_amount, deliveryMethodText, shippingCostText, notesHtml);
            }
        } else {
            return NextResponse.json({ error: 'Resending this type of email is not supported yet' }, { status: 400 });
        }

        await sendEmail(
            recipient[0], 
            subject, 
            html, 
            log.type, 
            log.order_id, 
            log.campaign_id
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error resending email:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
