import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

/**
 * Generates an order PDF by rendering proper RTL HTML and capturing it as an image.
 * This bypasses jsPDF's broken bidi text handling entirely — the browser's native
 * Unicode Bidirectional Algorithm handles Hebrew/English mixing perfectly.
 */
export const generateFullOrderPDFDoc = async (order) => {
    let items = order.items;
    if (typeof items === 'string') {
        try { items = JSON.parse(items); } catch (e) { items = []; }
    }
    if (!items || !Array.isArray(items)) items = [];

    const customer = order.customer_details || {};
    const customerName = (customer.name || '').replace(/\bnull\b/gi, '').trim();
    const deliveryText = order.delivery_method === 'self_pickup' ? 'איסוף עצמי' : 'משלוח';
    const dateStr = new Date(order.created_at).toLocaleDateString('he-IL');

    // Build product rows
    const productRows = items.map((item, index) => {
        const qty = item.quantity || 1;
        const name = item.name || `${item.brand || ''} ${item.model || ''}`;
        const size = String(item.size).includes('ml') ? item.size : `${item.size || ''} ml`;
        const price = item.price ? `₪${item.price}` : '';
        return `
            <tr>
                <td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right;">${index + 1}</td>
                <td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right;" dir="auto">${name}</td>
                <td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:center;"><span dir="ltr">${size}</span></td>
                <td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:center;">${qty}</td>
                <td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:left;">${price}</td>
            </tr>
        `;
    }).join('');

    // Build the full HTML document
    const html = `
        <div id="pdf-content" style="
            width: 595px;
            padding: 40px;
            font-family: 'Open Sans', Arial, sans-serif;
            direction: rtl;
            text-align: right;
            color: #222;
            background: #fff;
            box-sizing: border-box;
        ">
            <h1 style="font-size: 22px; margin: 0 0 6px 0; color: #111;">הזמנה מספר #${order.id}</h1>
            <p style="font-size: 13px; color: #666; margin: 0 0 20px 0;">תאריך: ${dateStr}</p>
            
            <h2 style="font-size: 16px; margin: 0 0 8px 0; color: #333; border-bottom: 2px solid #333; padding-bottom: 4px; display: inline-block;">פרטי מזמין:</h2>
            <p style="font-size: 13px; margin: 4px 0;">שם: ${customerName}</p>
            <p style="font-size: 13px; margin: 4px 0;">אימייל: <span dir="ltr">${customer.email || ''}</span></p>
            <p style="font-size: 13px; margin: 4px 0;">טלפון: <span dir="ltr">${customer.phone || ''}</span></p>
            ${customer.city ? `<p style="font-size: 13px; margin: 4px 0;">עיר: ${customer.city}</p>` : ''}
            ${customer.address ? `<p style="font-size: 13px; margin: 4px 0;">כתובת: ${customer.address}</p>` : ''}
            
            <div style="margin-top: 20px;">
                <h2 style="font-size: 16px; margin: 0 0 8px 0; color: #333; border-bottom: 2px solid #333; padding-bottom: 4px; display: inline-block;">פרטי משלוח ומידע נוסף:</h2>
                <p style="font-size: 13px; margin: 4px 0;">שיטת שילוח: ${deliveryText}</p>
                ${order.notes ? `<p style="font-size: 13px; margin: 4px 0;">הערות: ${order.notes}</p>` : ''}
                ${order.coupon_code ? `<p style="font-size: 13px; margin: 4px 0;">קוד קופון: ${order.coupon_code}</p>` : ''}
            </div>
            
            <div style="margin-top: 20px;">
                <h2 style="font-size: 16px; margin: 0 0 10px 0; color: #333; border-bottom: 2px solid #333; padding-bottom: 4px; display: inline-block;">מוצרים:</h2>
                <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
                    <thead>
                        <tr style="background: #f5f5f5;">
                            <th style="padding: 6px 8px; text-align: right; font-weight: bold; border-bottom: 2px solid #ddd;">#</th>
                            <th style="padding: 6px 8px; text-align: right; font-weight: bold; border-bottom: 2px solid #ddd;">שם מוצר</th>
                            <th style="padding: 6px 8px; text-align: center; font-weight: bold; border-bottom: 2px solid #ddd;">מידה</th>
                            <th style="padding: 6px 8px; text-align: center; font-weight: bold; border-bottom: 2px solid #ddd;">כמות</th>
                            <th style="padding: 6px 8px; text-align: left; font-weight: bold; border-bottom: 2px solid #ddd;">מחיר</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${productRows}
                    </tbody>
                </table>
            </div>
            
            <div style="margin-top: 25px; padding-top: 12px; border-top: 2px solid #333;">
                <p style="font-size: 18px; font-weight: bold; margin: 0;">סה"כ לתשלום: ₪${order.total_amount}</p>
            </div>
        </div>
    `;

    // Create an off-screen container to render the HTML
    const container = document.createElement('div');
    container.style.position = 'fixed';
    container.style.left = '-9999px';
    container.style.top = '0';
    container.innerHTML = `
        <style>
            @import url('https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap');
        </style>
        ${html}
    `;
    document.body.appendChild(container);

    try {
        // Wait for Open Sans font to be loaded
        await document.fonts.ready;
        
        const element = container.querySelector('#pdf-content');
        
        // Capture the HTML as a high-resolution canvas
        const canvas = await html2canvas(element, {
            scale: 2, // 2x resolution for crisp text
            useCORS: true,
            backgroundColor: '#ffffff',
            logging: false,
        });

        // Create A4 PDF and fit the canvas image into it
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Calculate image dimensions to fit A4 width with margins
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        // If content is taller than one page, we may need to split
        const imgData = canvas.toDataURL('image/png');
        
        if (imgHeight <= pageHeight) {
            doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
        } else {
            // Multi-page: slice the canvas
            const totalPages = Math.ceil(imgHeight / pageHeight);
            for (let page = 0; page < totalPages; page++) {
                if (page > 0) doc.addPage();
                const yOffset = -(page * pageHeight);
                doc.addImage(imgData, 'PNG', 0, yOffset, imgWidth, imgHeight);
            }
        }

        return doc;
    } finally {
        // Clean up the off-screen element
        document.body.removeChild(container);
    }
};
