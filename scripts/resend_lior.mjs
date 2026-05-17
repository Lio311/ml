import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import pg from 'pg';
import nodemailer from 'nodemailer';

const { Pool } = pg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

async function sendEmail(to, subject, html) {
    const mailOptions = {
        from: `"ml_tlv" <${process.env.EMAIL_USER}>`,
        subject,
        html,
        to
    };
    const info = await transporter.sendMail(mailOptions);
    console.log("Message sent: %s", info.messageId);
}

function replacePlaceholders(html, data = {}) {
    if (!html) return '';
    return html.replace(/\{\{(.*?)\}\}/g, (match, key) => {
        const value = data[key.trim()];
        return value !== undefined ? value : match;
    });
}

async function getTemplate(slug, data = {}) {
    const res = await pool.query('SELECT content_html, subject FROM email_templates WHERE slug = $1 AND is_active = true', [slug]);
    if (res.rows.length > 0) {
        const template = res.rows[0];
        return {
            html: replacePlaceholders(template.content_html, data),
            subject: replacePlaceholders(template.subject, data) || null
        };
    }
    return { html: '', subject: 'המלצות אישיות' }; 
}

async function resend() {
    try {
        const res = await pool.query(`
            SELECT p.id, p.suggested_products, o.customer_details, o.id as order_id
            FROM pending_recommendation_emails p
            JOIN orders o ON p.order_id = o.id
            WHERE o.customer_details->>'email' ILIKE '%liortsafrir%'
            ORDER BY p.created_at DESC
            LIMIT 1
        `);

        if (res.rows.length === 0) {
            console.log('No recommendation found for liortsafrir');
            return;
        }

        const rec = res.rows[0];
        const email = rec.customer_details?.email;
        const firstName = rec.customer_details?.first_name || 'לקוח';
        let suggestions = rec.suggested_products || [];
        
        console.log(`Found recommendation for ${email}`);

        if (typeof suggestions === 'string') {
            try { suggestions = JSON.parse(suggestions); } catch(e) { suggestions = []; }
        }

        const mappedProductsHtml = suggestions.map(p => {
            const imageUrl = p.image_url ? (p.image_url.startsWith('http') ? p.image_url : `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ml-tlv.com'}${p.image_url.startsWith('/') ? '' : '/'}${p.image_url}`) : '';
            return `
            <div style="background: white; border: 1px solid #eee; padding: 15px; border-radius: 8px; margin-bottom: 15px; text-align: center;">
                ${imageUrl ? `<img src="${imageUrl}" alt="${p.name}" style="max-height: 150px; width: auto; margin-bottom: 10px;">` : ''}
                <br>
                <strong>${p.name}</strong> - ${p.brand}<br>
                <span style="color: #666; font-size: 14px;">תווים דומים: ${p.notes}</span>
            </div>
            `;
        }).join('');

        let { html, subject } = await getTemplate('recommendations', { name: firstName, productsHtml: mappedProductsHtml });
        
        if (!html) {
             html = `
                <div dir="rtl" style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; text-align: right;">
                    <h2>שלום ${firstName}!</h2>
                    <p>עבדנו קצת על הטעם האישי שלך והכנו לך המלצות מיוחדות מבוססות על הרכישות הקודמות שלך:</p>
                    <div style="background: #fdfaf6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        ${mappedProductsHtml}
                    </div>
                    <p>כל הניחוחות זמינים כדוגמיות להתנסות אצלנו באתר.</p>
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://www.ml-tlv.com" style="background: #000; color: #fff; padding: 12px 25px; text-decoration: none; border-radius: 6px; font-weight: bold;">
                            למעבר לאתר >>
                        </a>
                    </div>
                </div>`;
             subject = 'במיוחד בשבילך... המלצות ניחוחות שמחכות לך ✨';
        }

        console.log('Sending email...');
        await sendEmail(email, subject, html);
        console.log('Done!');
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}

resend();
