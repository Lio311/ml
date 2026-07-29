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
    const productRows = items.flatMap((item, index) => {
        const qty = item.quantity || 1;
        const name = item.name || (item.type === 'bundle' ? `חבילת ${item.bundleType || ''}` : `${item.brand || ''} ${item.model || ''}`);
        
        // Use volume_label if available (especially for discovery sets which might have size: '1'), otherwise fallback to size
        let rawSize = item.volume_label || item.size;
        if (typeof rawSize === 'string') {
            rawSize = rawSize.replace('מ״ל', 'ml').trim();
        }
        const size = String(rawSize).toLowerCase().includes('ml') ? rawSize : `${rawSize || ''} ml`;
        const price = item.price ? `₪${item.price}` : '';
        const mainRow = `
            <tr>
                <td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right;">${index + 1}</td>
                <td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right;" dir="auto">${name}</td>
                <td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:center;"><span dir="ltr">${size}</span></td>
                <td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:center;">${qty}</td>
                <td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:left;">${price}</td>
            </tr>
        `;
        
        let subRows = [];
        if (item.type === 'bundle' && Array.isArray(item.items) && item.items.length > 0) {
            subRows = item.items.map((subItem) => {
                let subRawSize = subItem.volume_label || subItem.size;
                if (typeof subRawSize === 'string') {
                    subRawSize = subRawSize.replace('מ״ל', 'ml').trim();
                }
                const subSize = subRawSize ? (String(subRawSize).toLowerCase().includes('ml') ? subRawSize : `${subRawSize} ml`) : '';
                return `
                <tr>
                    <td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right;"></td>
                    <td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:right; font-size:10px; color:#666;" dir="auto">
                        ↳ ${subItem.brand || ''} ${subItem.model || ''}
                    </td>
                    <td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:center; font-size:10px; color:#666;"><span dir="ltr">${subSize}</span></td>
                    <td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:center; font-size:10px; color:#666;">1</td>
                    <td style="padding:4px 8px; border-bottom:1px solid #eee; text-align:left;"></td>
                </tr>
            `});
        }
        
        return [mainRow, ...subRows];
    }).join('');

    const formatAddress = (addr) => {
        if (!addr) return '';
        if (typeof addr === 'string') return addr;
        let res = `${addr.street || ''} ${addr.houseNumber || ''}`.trim();
        if (addr.apartment && addr.apartment !== '0') res += ` / ${addr.apartment}`;
        if (addr.city) res += `, ${addr.city}`;
        return res;
    };
    const addressStr = formatAddress(customer.address);

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
            ${addressStr ? `<p style="font-size: 13px; margin: 4px 0;">כתובת: ${addressStr}</p>` : ''}
            
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
        
        const margin = 15; // 15mm margin
        const usableHeight = pageHeight - (margin * 2);
        
        // Calculate image dimensions to fit A4 width
        const imgWidth = pageWidth;
        const imgHeight = (canvas.height * imgWidth) / canvas.width;

        const imgData = canvas.toDataURL('image/jpeg', 0.92);
        
        if (imgHeight <= usableHeight) {
            doc.addImage(imgData, 'JPEG', 0, margin, imgWidth, imgHeight);
        } else {
            // Multi-page: slice the canvas
            const totalPages = Math.ceil(imgHeight / usableHeight);
            for (let page = 0; page < totalPages; page++) {
                if (page > 0) doc.addPage();
                const yOffset = margin - (page * usableHeight);
                doc.addImage(imgData, 'JPEG', 0, yOffset, imgWidth, imgHeight);
                
                // Mask the top and bottom to create clean margins
                doc.setFillColor(255, 255, 255);
                doc.rect(0, 0, pageWidth, margin, 'F'); // Top margin
                doc.rect(0, pageHeight - margin, pageWidth, margin, 'F'); // Bottom margin
            }
        }

        return doc;
    } finally {
        // Clean up the off-screen element
        document.body.removeChild(container);
    }
};
