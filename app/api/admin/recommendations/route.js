import pool from '@/app/lib/db';
import { auth as clerkAuth } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { recordAuditLog } from '@/app/lib/audit';
import nodemailer from 'nodemailer';

export async function GET(req) {
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        const role = adminCheck.rows[0]?.role;
        if (role !== 'admin' && role !== 'deputy') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const result = await pool.query(`
            SELECT p.id, p.user_id, p.order_id, p.suggested_products, p.status, p.created_at,
                   o.customer_details, o.items as original_items
            FROM pending_recommendation_emails p
            JOIN orders o ON p.order_id = o.id
            WHERE p.status = 'pending'
            ORDER BY p.created_at DESC
        `);

        return NextResponse.json(result.rows);
    } catch (error) {
        console.error('Error fetching recommendations:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function POST(req) {
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        const role = adminCheck.rows[0]?.role;
        if (role !== 'admin' && role !== 'deputy') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const { id } = await req.json();
        if (!id) return new NextResponse('ID is required', { status: 400 });

        const recData = await pool.query(`
            SELECT p.user_id, p.suggested_products, o.customer_details, o.id as orderId
            FROM pending_recommendation_emails p
            JOIN orders o ON p.order_id = o.id
            WHERE p.id = $1 AND p.status = 'pending'
        `, [id]);

        if (recData.rows.length === 0) {
            return new NextResponse('Pending recommendation not found', { status: 404 });
        }

        const data = recData.rows[0];
        const email = data.customer_details?.email;
        const firstName = data.customer_details?.first_name || 'לקוח';
        const suggestions = data.suggested_products || []; // Array of objects! It is stored as JSON

        if (!email) {
            await pool.query('UPDATE pending_recommendation_emails SET status = $1 WHERE id = $2', ['rejected_no_email', id]);
            return NextResponse.json({ success: true, message: "No email, rejected." });
        }

        // Generate email HTML for products
        const productsHtml = typeof suggestions === 'string' ? JSON.parse(suggestions) : suggestions;
        const mappedProductsHtml = productsHtml.map(p => `
            <div style="background: white; border: 1px solid #eee; padding: 15px; border-radius: 8px; margin-bottom: 15px; text-align: center;">
                ${p.image_url ? `<img src="${p.image_url}" alt="${p.name}" style="max-height: 150px; width: auto; margin-bottom: 10px;">` : ''}
                <br>
                <strong>${p.name}</strong> - ${p.brand}<br>
                <span style="color: #666; font-size: 14px;">תווים דומים: ${p.notes}</span>
            </div>
        `).join('');

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            }
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'במיוחד בשבילך... המלצות ניחוחות שמחכות לך ✨',
            html: `
                <div dir="rtl" style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; text-align: right;">
                    <h2>שלום ${firstName}!</h2>
                    <p>עבר קצת זמן מאז ההזמנה האחרונה שלך, וכבר למדנו קצת על הטעם האישי שלך.</p>
                    <p>צוות המומחים שלנו והמערכת החכמה שלנו איתרו במיוחד עבורך כמה בשמים שמבוססים על תווי הריח שאתה אוהב שכדאי לך להכיר:</p>
                    
                    <div style="background: #fdfaf6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        ${mappedProductsHtml}
                    </div>

                    <p>כל הניחוחות זמינים כדוגמיות להתנסות אצלנו באתר.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://www.ml-tlv.com" style="background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            למעבר לאתר &gt;&gt;
                        </a>
                    </div>
                </div>
            `
        });

        // Mark as approved (sent)
        await pool.query('UPDATE pending_recommendation_emails SET status = $1 WHERE id = $2', ['approved', id]);

        await recordAuditLog({
            userId,
            action: 'approve_recommendation_email',
            entityType: 'recommendation_email',
            entityId: String(id),
            details: { orderId: data.orderId, productsCount: productsHtml.length },
            req
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error approving recommendation:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}

export async function DELETE(req) {
    try {
        const authData = await clerkAuth();
        const userId = authData?.userId;
        if (!userId) return new NextResponse('Unauthorized', { status: 401 });

        const adminCheck = await pool.query('SELECT role FROM users WHERE id = $1', [userId]);
        const role = adminCheck.rows[0]?.role;
        if (role !== 'admin' && role !== 'deputy') {
            return new NextResponse('Forbidden', { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) return new NextResponse('ID is required', { status: 400 });

        await pool.query('UPDATE pending_recommendation_emails SET status = $1 WHERE id = $2', ['rejected', id]);

        await recordAuditLog({
            userId,
            action: 'reject_recommendation_email',
            entityType: 'recommendation_email',
            entityId: String(id),
            details: {},
            req
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error rejecting recommendation:', error);
        return new NextResponse('Internal Error', { status: 500 });
    }
}
