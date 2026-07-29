import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import pool from '@/app/lib/db';
import { sendEmail, getTemplate, getStatusUpdateTemplate } from '@/app/lib/email';
import { getBrandName } from '@/app/lib/brand';

export async function POST(req) {
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    const email = user?.emailAddresses[0]?.emailAddress;
    if (email !== process.env.ADMIN_EMAIL && role !== 'admin') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const client = await pool.connect();
    try {
        let queryText = `
            SELECT p.order_id, p.initial_status, p.process_at,
                   o.status as current_status, o.customer_details
            FROM pending_order_emails p
            JOIN orders o ON p.order_id = o.id
            WHERE p.process_at <= NOW()
        `;
        
        const res = await client.query(queryText);

        for (const row of res.rows) {
            const { order_id, initial_status, current_status, customer_details } = row;

            // Delete the pending record so we don't process it again
            await client.query('DELETE FROM pending_order_emails WHERE order_id = $1', [order_id]);

            // Check if status has changed
            if (current_status !== initial_status && current_status !== 'no_change') {
                const customerEmail = typeof customer_details === 'string' 
                    ? JSON.parse(customer_details)?.email 
                    : customer_details?.email;
                
                const customerName = typeof customer_details === 'string' 
                    ? JSON.parse(customer_details)?.name 
                    : customer_details?.name;

                if (customerEmail) {
                    try {
                        const statusMap = {
                            'pending': { label: 'ממתין', body: 'ההזמנה שלך התקבלה וממתינה לאישור.' },
                            'processing': { label: 'בטיפול', body: 'ההזמנה שלך התקבלה ונמצאת בטיפול הצוות.' },
                            'shipped': { label: 'נשלחה', body: 'חדשות טובות! ההזמנה שלך נארזה ונמסרה לשליח / יצאה למשלוח.' },
                            'ready_for_pickup': { label: 'מוכנה לאיסוף', body: 'ההזמנה שלך מוכנה לאיסוף! מוזמנים להגיע ולאסוף אותה.' },
                            'completed': { label: 'הושלמה / נמסרה', body: 'ההזמנה נמסרה בהצלחה. תודה שבחרת בנו!' },
                            'cancelled': { label: 'בוטלה', body: 'ההזמנה בוטלה. אם זו טעות, נא ליצור איתנו קשר.' }
                        };
                        
                        const mapped = statusMap[current_status] || { label: current_status, body: `הסטטוס של ההזמנה שלך עודכן ל-${current_status}.` };
                        const cleanName = (customerName || '').replace(/\bnull\b/gi, '').trim();

                        const { html: dynamicHtml, subject: dynamicSubject } = await getTemplate('status_update', { 
                            orderId: order_id, 
                            status: mapped.label, 
                            messageBody: mapped.body,
                            name: cleanName 
                        }, getStatusUpdateTemplate.bind(null, order_id, cleanName, mapped.label, mapped.body));
                        
                        const brandName = await getBrandName();
                        await sendEmail(customerEmail, dynamicSubject || `עדכון סטטוס הזמנה #${order_id} - ${brandName}`, dynamicHtml, 'status_update', order_id);
                    } catch (e) {
                        console.error(`Error sending delayed email for order ${order_id}:`, e);
                    }
                }
            }
        }

        return NextResponse.json({ success: true, processedCount: res.rows.length });
    } catch (error) {
        console.error('Error processing delayed emails:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    } finally {
        client.release();
    }
}
