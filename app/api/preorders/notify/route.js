import { NextResponse } from 'next/server';
import pool from '@/app/lib/db';
import { auth } from '@clerk/nextjs/server';
import { sendEmail } from '@/app/lib/email';

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

export async function POST(req) {
    try {
        const { sessionClaims } = await auth();
        const userEmail = sessionClaims?.email;
        if (!userEmail || userEmail !== ADMIN_EMAIL) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { productId } = await req.json();

        if (!productId) {
            return NextResponse.json({ error: 'Product ID is required' }, { status: 400 });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Set product is_preorder to false
            const productRes = await client.query(
                'UPDATE products SET is_preorder = false WHERE id = $1 RETURNING *',
                [productId]
            );

            if (productRes.rows.length === 0) {
                await client.query('ROLLBACK');
                return NextResponse.json({ error: 'Product not found' }, { status: 404 });
            }

            const product = productRes.rows[0];

            // Get pending preorders
            const preordersRes = await client.query(
                "SELECT id, user_email FROM preorders WHERE product_id = $1 AND status = 'pending'",
                [productId]
            );

            const pendingUsers = preordersRes.rows;

            if (pendingUsers.length > 0) {
                // Send emails
                const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.ml-tlv.com';
                const productUrl = `${siteUrl}/product/${product.slug}`;

                const subject = `חדשות מעולות! ${product.name} זמין כעת לרכישה`;
                const html = `
                    <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333; text-align: center;">
                        <img src="${product.image_url}" alt="${product.name}" style="max-width: 200px; border-radius: 12px; margin-bottom: 20px;" />
                        <h1 style="color: #000; font-size: 24px; margin-bottom: 10px;">חדשות מעולות!</h1>
                        <p style="font-size: 16px; line-height: 1.5; color: #555;">
                            המוצר שחיכית לו - <strong>${product.name}</strong> - נחת באתר וזמין כעת לרכישה.
                        </p>
                        <p style="font-size: 16px; line-height: 1.5; color: #555; margin-bottom: 30px;">
                            הזדרזו להזמין לפני שייגמר המלאי!
                        </p>
                        <a href="${productUrl}" style="background-color: #000; color: #fff; text-decoration: none; padding: 12px 30px; border-radius: 8px; font-weight: bold; display: inline-block; font-size: 16px;">
                            לרכישת המוצר
                        </a>
                        <p style="margin-top: 40px; font-size: 12px; color: #999;">
                            צוות ML-TLV
                        </p>
                    </div>
                `;

                for (const user of pendingUsers) {
                    if (user.user_email) {
                        await sendEmail(user.user_email, subject, html, 'system');
                    }
                }

                // Update status to notified
                const ids = pendingUsers.map(u => u.id);
                await client.query(
                    "UPDATE preorders SET status = 'notified' WHERE id = ANY($1)",
                    [ids]
                );
            }

            await client.query('COMMIT');
            return NextResponse.json({ success: true, notifiedCount: pendingUsers.length });
        } catch (err) {
            await client.query('ROLLBACK');
            throw err;
        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Error notifying preorders:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
