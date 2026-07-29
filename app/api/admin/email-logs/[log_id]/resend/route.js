import pool from '@/app/lib/db';
import { sendEmail, getOrderConfirmationTemplate, formatItemsHtmlCustomer, formatNotesHtml, getOrderUpdatedTemplate, getStatusUpdateTemplate, getTemplate } from '@/app/lib/email';
import { getBrandName, buildVariants } from '@/app/lib/brand';
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
            
            let deliveryMethodText = 'איסוף עצמי (תל אביב)';
            if (order.delivery_method === 'mail') deliveryMethodText = 'משלוח עד נקודת איסוף';
            else if (order.delivery_method === 'home_delivery') deliveryMethodText = 'משלוח עד הבית';
            let shippingCostText = order.shipping_cost === 0 ? 'חינם' : `${order.shipping_cost} ₪`;

            html = getOrderConfirmationTemplate(
                order.id, 
                itemsHtml, 
                order.total_amount, 
                0, // freeSamples
                notesHtml, 
                deliveryMethodText, 
                shippingCostText
            );
        } else if (log.type === 'order_updated' || log.type === 'order_update') {
            if (!log.order_id) return NextResponse.json({ error: 'Order ID missing' }, { status: 400 });
            const orderRes = await pool.query(`SELECT * FROM orders WHERE id = $1`, [log.order_id]);
            if (orderRes.rows.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
            
            const order = orderRes.rows[0];
            const items = order.items;
            const notesHtml = formatNotesHtml(order.notes);
            
            let deliveryMethodText = 'איסוף עצמי (תל אביב)';
            if (order.delivery_method === 'mail') deliveryMethodText = 'משלוח עד נקודת איסוף';
            else if (order.delivery_method === 'home_delivery') deliveryMethodText = 'משלוח עד הבית';
            let shippingCostText = order.shipping_cost === 0 ? 'חינם' : `${order.shipping_cost} ₪`;

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
            const name = order.customer_details?.firstName || 'לקוח';
            
            html = getStatusUpdateTemplate(
                order.id,
                name,
                order.status,
                '' // messageBody we might not have it exactly as it was, but we resend the status update
            );
        } else if (log.type === 'cart_recovery') {
            // Try to find the existing coupon for this user
            const couponRes = await pool.query(`
                SELECT code FROM coupons 
                WHERE email = $1 AND code LIKE 'SAVE5-%'
                ORDER BY created_at DESC LIMIT 1
            `, [log.recipient]);
            
            let couponCode = 'SAVE5-RSND';
            if (couponRes.rows.length > 0) {
                couponCode = couponRes.rows[0].code;
            } else {
                const randomPart = Math.random().toString(36).substring(2, 7).toUpperCase();
                couponCode = `SAVE5-${randomPart}`;
            }

            const templateResult = await getTemplate('cart_recovery', 
                { couponCode },
                async () => {
                    const brandNameStr = await getBrandName();
                    const brandVariants = buildVariants(brandNameStr);
                    return `
                    <div dir="rtl" style="font-family: Arial, sans-serif; color: #333;">
                        <h2>ראינו שהשארת מספר פריטים בסל... 👀</h2>
                        <p>אנחנו שומרים לך עליהם, אבל המלאי מוגבל!</p>
                        <p>כדי להקל עליך, הנה קוד קופון מיוחד של <strong>5% הנחה</strong>:</p>
                        <div style="background: #f0fdf4; border: 2px dashed #16a34a; padding: 15px; text-align: center; margin: 20px 0;">
                            <h1 style="color: #16a34a; margin: 0;">${couponCode}</h1>
                            <p style="margin: 5px 0 0 0; color: #666; font-size: 12px;">תקף ל-24 השעות הקרובות בלבד!</p>
                        </div>
                        <p>
                            <a href="https://www.ml-tlv.com/cart" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                                לחזרה לעגלה >>
                            </a>
                        </p>
                    </div>`;
                }
            );
            html = templateResult.html;
        } else {
            return NextResponse.json({ error: `Resending this type of email (${log.type}) is not supported yet` }, { status: 400 });
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
