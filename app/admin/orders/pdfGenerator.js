import { jsPDF } from 'jspdf';

// Helper to convert ArrayBuffer to Base64 in browser
const arrayBufferToBase64 = (buffer) => {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
};

// Helper to fix BiDi (Right-to-Left) text for jsPDF 4.x
// jsPDF 4.x has an internal UBA that auto-handles pure digit runs,
// but does NOT un-reverse Latin letter runs. Strategy:
// 1. Reverse the entire string (Hebrew renders correctly R-to-L)
// 2. Un-reverse only runs that contain at least one Latin letter
// 3. Leave pure digit runs alone (jsPDF handles those)
const fixBidi = (str) => {
    if (!str) return '';
    const reversed = str.split('').reverse().join('');
    const ltrRegex = /[A-Za-z0-9@.\-_#+/,()]+(?:[\s\u00A0]+[A-Za-z0-9@.\-_#+/,()]+)*/g;
    return reversed.replace(ltrRegex, match => {
        if (/[A-Za-z]/.test(match)) {
            return match.split('').reverse().join('');
        }
        return match;
    });
};

export const generateFullOrderPDFDoc = async (order) => {
    // Fetch font from public directory
    const fontUrl = '/fonts/Narkiss Block Regular.ttf';
    const response = await fetch(fontUrl);
    if (!response.ok) {
        throw new Error("Failed to load font. Check font path.");
    }
    const fontBuffer = await response.arrayBuffer();
    const base64String = arrayBufferToBase64(fontBuffer);
    
    // Create PDF (A4 Portrait)
    const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
    });
    
    doc.addFileToVFS('Narkiss.ttf', base64String);
    doc.addFont('Narkiss.ttf', 'Narkiss', 'normal');
    doc.setFont('Narkiss');
    
    let items = order.items;
    if (typeof items === 'string') {
        try {
            items = JSON.parse(items);
        } catch (e) {
            items = [];
        }
    }

    if (!items || !Array.isArray(items)) {
        items = [];
    }

    // Start Drawing
    let y = 20;
    const pageWidth = doc.internal.pageSize.getWidth();
    const rightMargin = pageWidth - 20;

    doc.setFontSize(20);
    doc.text(fixBidi(`הזמנה מספר #${order.id}`), rightMargin, y, { align: 'right' });
    y += 10;
    doc.setFontSize(12);
    doc.text(fixBidi(`תאריך: ${new Date(order.created_at).toLocaleDateString('he-IL')}`), rightMargin, y, { align: 'right' });
    y += 15;

    // Customer Details
    doc.setFontSize(16);
    doc.text(fixBidi('פרטי מזמין:'), rightMargin, y, { align: 'right' });
    y += 8;
    doc.setFontSize(12);
    
    const customer = order.customer_details || {};
    const customerLines = [
        `שם: ${(customer.name || '').replace(/\bnull\b/gi, '').trim()}`,
        `אימייל: ${customer.email || ''}`,
        `טלפון: ${customer.phone || ''}`,
    ];
    
    if (customer.city) customerLines.push(`עיר: ${customer.city}`);
    if (customer.address) customerLines.push(`כתובת: ${customer.address}`);
    
    customerLines.forEach(line => {
        doc.text(fixBidi(line), rightMargin, y, { align: 'right' });
        y += 6;
    });

    y += 10;
    doc.setFontSize(16);
    doc.text(fixBidi('פרטי משלוח ומידע נוסף:'), rightMargin, y, { align: 'right' });
    y += 8;
    doc.setFontSize(12);

    let deliveryText = order.delivery_method === 'self_pickup' ? 'איסוף עצמי' : 'משלוח';
    doc.text(fixBidi(`שיטת שילוח: ${deliveryText}`), rightMargin, y, { align: 'right' });
    y += 6;
    if (order.notes) {
        doc.text(fixBidi(`הערות: ${order.notes}`), rightMargin, y, { align: 'right' });
        y += 6;
    }
    if (order.coupon_code) {
        doc.text(fixBidi(`קוד קופון: ${order.coupon_code}`), rightMargin, y, { align: 'right' });
        y += 6;
    }

    y += 10;
    doc.setFontSize(16);
    doc.text(fixBidi('מוצרים:'), rightMargin, y, { align: 'right' });
    y += 8;
    
    doc.setFontSize(11);
    items.forEach((item, index) => {
        const qty = item.quantity || 1;
        const name = item.name || `${item.brand || ''} ${item.model || ''}`;
        const size = String(item.size).includes('ml') ? item.size : `${item.size || ''} ml`;
        const price = item.price ? `₪${item.price}` : '';

        let line = `${index + 1}. ${name} | מידה: ${size} | כמות: ${qty}`;
        if (price) {
            line += ` | מחיר: ${price}`;
        }

        doc.text(fixBidi(line), rightMargin, y, { align: 'right' });
        y += 7;

        if (y > 270) {
            doc.addPage();
            y = 20;
        }
    });

    y += 15;
    doc.setFontSize(16);
    
    const total = order.total_amount;
    doc.text(fixBidi(`סה"כ לתשלום: ₪${total}`), rightMargin, y, { align: 'right' });
    
    return doc;
};
