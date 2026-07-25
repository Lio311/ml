import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config({ path: './.env.local' });

const getNewPreorderTemplate = (data) => {
    return `
    <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; line-height: 1.6;">
        <div style="background-color: #fff; padding: 40px 30px; border-radius: 24px; border: 1px solid #e0f2fe; box-shadow: 0 4px 20px rgba(0,0,0,0.03);">
            <div style="text-align: center; margin-bottom: 25px;">
                <div style="display: inline-block; background-color: #e0f2fe; color: #0284c7; font-size: 12px; font-weight: 900; padding: 6px 12px; border-radius: 20px; margin-bottom: 15px; letter-spacing: 1px;">הזמנה מוקדמת</div>
                <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #000;">בדרך לאתר: ${data.brand || ''} ${data.model || ''}</h1>
            </div>
            
            <div style="text-align: center; margin-bottom: 30px;">
                <img src="${data.image_url || data.imageUrl || 'https://www.ml-tlv.com/logo-black.png'}" alt="${data.brand || ''} ${data.model || ''}" style="max-width: 250px; height: auto; border-radius: 16px; margin: 0 auto; box-shadow: 0 10px 25px rgba(0,0,0,0.05);" />
            </div>

            <div style="background-color: #f8fafc; border-radius: 16px; padding: 25px; margin-bottom: 30px; text-align: center;">
                <p style="margin: 0; font-size: 16px; color: #475569;">
                    הבושם המבוקש הזה נמצא בדרכו אלינו, והחלטנו לאפשר לכם להירשם להזמנה מוקדמת כדי להבטיח שלא תפספסו!
                </p>
                <div style="font-weight: bold; color: #ca8a04; font-size: 18px; margin-top: 15px;">
                    מחיר צפוי החל מ- ${data.price_2ml || ''} ₪
                </div>
            </div>

            <div style="text-align: center;">
                <a href="https://www.ml-tlv.com/product/${data.slug || data.id || ''}" style="display: inline-block; background-color: #0284c7; color: #fff; padding: 18px 40px; text-decoration: none; border-radius: 16px; font-weight: 900; font-size: 16px; box-shadow: 0 4px 15px rgba(2, 132, 199, 0.3);">
                    להרשמה להזמנה המוקדמת >>
                </a>
            </div>
        </div>
    </div>
    `;
};

async function sendEmail(to, subject, html) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });
    await transporter.sendMail({
        from: '"ml. Admin" <' + process.env.EMAIL_USER + '>',
        to,
        subject,
        html
    });
}

async function run() {
    const adminEmail = process.env.ADMIN_EMAIL || 'lior31197@gmail.com';
    const data = {
        brand: 'BORNTOSTANDOUT',
        model: 'Black Mango',
        image_url: 'https://www.ml-tlv.com/logo-black.png', // Fallback, let's see if we can get the real one
        price_2ml: '180',
        slug: 'black-mango'
    };
    
    // I can fetch from local API just to get the image
    try {
        const res = await fetch('http://localhost:3000/api/products');
        const products = await res.json();
        const mango = products.find(p => p.model?.toLowerCase().includes('mango') || p.name?.toLowerCase().includes('mango'));
        if (mango) {
            data.brand = mango.brand || 'BORNTOSTANDOUT';
            data.model = mango.model || 'Black Mango';
            data.image_url = mango.image_url || data.image_url;
            data.price_2ml = mango.price_2ml || mango.price || '180';
            data.slug = mango.slug || mango.id;
        }
    } catch(e) {
        console.log("Could not fetch products", e.message);
    }

    const html = getNewPreorderTemplate(data);
    const subject = `🆕 חדש באתר: ${data.brand} ${data.model}`;
    await sendEmail(adminEmail, subject, html, 'marketing');
    console.log("Sent to admin:", adminEmail);
    process.exit(0);
}
run();
