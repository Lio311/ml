const getAbsoluteImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.ml-tlv.com';
    return `${baseUrl}${url.startsWith('/') ? '' : '/'}${url}`;
};

export const monthsHe = [
    "ינואר", "פברואר", "מרץ", "אפריל", "מאי", "יוני",
    "יולי", "אוגוסט", "ספטמבר", "אוקטובר", "נובמבר", "דצמבר"
];

export const getManagerReminderTemplate = (monthStr) => {
    const adminUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://www.ml-tlv.com'}/admin/monthly-recommendation`;
    
    return `
        <div dir="rtl" style="font-family: 'Open Sans', 'Open Sans Hebrew', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 30px; background-color: #f9f9fa; border-radius: 12px;">
            <div style="background-color: #ffffff; padding: 40px; border-radius: 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.03); text-align: center;">
                <h1 style="color: #050505; font-size: 24px; margin-bottom: 10px;">תזכורת: בחירת המלצת החודש</h1>
                <p style="color: #666; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
                    היי ליאור,<br>
                    הגיע הזמן לבחור את 4 הבשמים המומלצים לחודש ${monthStr}.
                    <br><br>
                    אם לא תבחר בשמים עד ה-28 לחודש, המייל המיוחד ללקוחות לא יישלח החודש.
                </p>
                <a href="${adminUrl}" style="display: inline-block; background-color: #007AFF; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 12px rgba(0,122,255,0.3);">
                    היכנס לבחור בשמים
                </a>
            </div>
        </div>
    `;
};

export const generateProductsGrid = (products) => {
    return products.map(p => `
        <div style="width: 48%; margin-bottom: 20px; background-color: #ffffff; border-radius: 12px; padding: 15px; box-sizing: border-box; text-align: center; border: 1px solid #f0f0f0;">
            <a href="https://www.ml-tlv.com/product/${p.id}" style="text-decoration: none; color: inherit;">
                <img src="${getAbsoluteImageUrl(p.image_url)}" alt="${p.name}" style="width: 100%; max-width: 150px; height: auto; margin-bottom: 15px; object-fit: contain;">
                <div style="font-size: 12px; color: #007AFF; font-weight: bold; margin-bottom: 4px; text-transform: uppercase;">${p.brand}</div>
                <div style="font-size: 15px; color: #050505; font-weight: bold; margin-bottom: 8px;">${p.name}</div>
                <div style="font-size: 14px; color: #666; margin-bottom: 15px;">₪${p.price}</div>
                <div style="display: inline-block; background-color: #050505; color: #ffffff; text-decoration: none; padding: 8px 16px; border-radius: 6px; font-size: 13px; font-weight: bold;">
                    לפרטים ורכישה
                </div>
            </a>
        </div>
    `).join('');
};

export const getMonthlyRecommendationTemplate = async (products, couponCode, monthNum) => {
    const monthName = monthsHe[monthNum - 1];
    const productsHtml = generateProductsGrid(products);

    return `
        <div dir="rtl" style="font-family: 'Inter', 'Open Sans Hebrew', Arial, sans-serif; background-color: #fafafa; padding: 40px 0;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0,0,0,0.05);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #050505 0%, #1a1a1a 100%); padding: 50px 30px; text-align: center;">
                    <div style="color: #007AFF; font-size: 14px; font-weight: 800; tracking: 2px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 2px;">
                        ml_tlv
                    </div>
                    <h1 style="color: #ffffff; font-size: 32px; font-weight: 900; margin: 0 0 15px 0; line-height: 1.2;">
                        המלצת החודש של מנהל האתר
                    </h1>
                    <p style="color: #a0a0a0; font-size: 16px; margin: 0; font-weight: 400;">
                        הבחירות האישיות שלי לחודש ${monthName}
                    </p>
                </div>

                <!-- Content -->
                <div style="padding: 40px 30px;">
                    <p style="color: #444; font-size: 16px; line-height: 1.6; text-align: center; margin-bottom: 40px;">
                        כמו בכל חודש, בחרתי עבורכם את הניחוחות המיוחדים ביותר. 
                        ארבעת הבשמים האלו הם ההמלצה האישית שלי אליכם, וכל אחד מהם נבחר בקפידה.
                    </p>

                    <!-- Products Grid -->
                    <div style="display: flex; flex-wrap: wrap; justify-content: space-between;">
                        ${productsHtml}
                    </div>

                    <!-- Coupon Section -->
                    <div style="margin-top: 40px; background-color: #f8f9fc; border: 2px dashed #007AFF; border-radius: 16px; padding: 30px; text-align: center;">
                        <h3 style="color: #050505; font-size: 20px; margin: 0 0 10px 0; font-weight: 800;">
                            הטבה בלעדית למנויים
                        </h3>
                        <p style="color: #666; font-size: 15px; margin: 0 0 20px 0;">
                            קוד קופון מיוחד המעניק 10% הנחה על הבשמים המומלצים.
                            <br>הקופון תקף ליומיים בלבד!
                        </p>
                        <div style="display: inline-block; background-color: #ffffff; color: #007AFF; font-size: 24px; font-weight: 900; padding: 12px 30px; border-radius: 8px; border: 1px solid #e0e0e0; letter-spacing: 2px;">
                            ${couponCode}
                        </div>
                    </div>

                </div>

                <!-- Footer -->
                <div style="background-color: #050505; padding: 30px; text-align: center;">
                    <p style="color: #888; font-size: 13px; margin: 0;">
                        באהבה,<br>ליאור ממל_tlv
                    </p>
                </div>
            </div>
        </div>
    `;
};
