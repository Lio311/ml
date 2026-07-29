import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { sendEmail } from '@/app/lib/email';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { getBrandName } from '@/app/lib/brand';

import { generateReviewToken } from '@/app/lib/reviewToken';

export async function GET(req) {
    try {
        const { searchParams } = new URL(req.url);
        const orderId = searchParams.get('orderId');

        const authData = await clerkAuth();
        const userId = authData?.userId;

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized. Please log in as admin.' }, { status: 401 });
        }

        const userCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        if (userCheck.rows[0]?.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden. Admin access required.' }, { status: 403 });
        }

        if (!orderId) {
             return NextResponse.json({ error: 'Missing orderId param. Use ?orderId=XYZ' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            const res = await client.query(`SELECT id, customer_details, items FROM orders WHERE id = $1`, [orderId]);
            if (res.rows.length === 0) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

            const order = res.rows[0];
            const customer = order.customer_details || {};
            const email = customer.email;
            const firstName = customer.first_name || 'לקוח';
            
            if (!email) return NextResponse.json({ error: 'Order has no customer email.' }, { status: 400 });

            const items = order.items || [];
            const firstProductName = items.length > 0 ? items[0].name : "הבשמים שלנו";

            const token = generateReviewToken(order.id);
            const brandName = await getBrandName();

            const subject = 'נשמח לשמוע מה דעתך! ⭐';
            const html = `
                <div dir="rtl" style="font-family: Arial, sans-serif; color: #333; line-height: 1.6; max-width: 600px; margin: 0 auto; text-align: right;">
                    <h2 style="color: #111827;">שלום ${firstName},</h2>
                    <p>ראינו שקיבלת לא מזמן את ההזמנה האחרונה שלך מאיתנו ואנחנו סקרנים לדעת איך הייתה חוויית השירות שלך איתנו!</p>
                    <p>חוות הדעת שלך על איכות הטיפול בהזמנה ומהירות המשלוח חשובה לנו מאוד ועוזרת לנו להמשיך ולהעניק לך את השירות הטוב ביותר.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://www.ml-tlv.com/review?id=${order.id}&token=${token}" style="background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
                            לדירוג חוויית השירות בקליק &gt;&gt;
                        </a>
                        <p style="margin-top: 15px;">
                            <a href="https://www.ml-tlv.com/orders?review=${order.id}" style="color: #666; text-decoration: underline; font-size: 14px;">
                                לדירוג חוויית השירות באזור האישי &gt;&gt;
                            </a>
                        </p>
                    </div>

                    <p style="text-align: center; color: #d97706; font-weight: bold; background: #fef3c7; padding: 10px; border-radius: 6px;">
                        🎁 בונוס קטן: על כל דירוג שתשאיר/י באתר, נשלח אליך למייל קופון של 10% הנחה לקנייה הבאה!
                    </p>
                    
                    <p>תודה מראש,<br>צוות ${brandName}</p>
                </div>
            `;

            await sendEmail(email, subject, html, 'manual_review_request', order.id);
            await client.query(`UPDATE orders SET review_email_sent = true WHERE id = $1`, [orderId]);

            return NextResponse.json({ success: true, message: `Review email successfully dispatched to ${email} for Order ${orderId}` });
        } finally {
            client.release();
        }
    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: 'Internal server error', details: e.message }, { status: 500 });
    }
}
