/**
 * Generates a responsive HTML catalog grid for emails.
 * Uses table layouts and inline styles for maximum compatibility.
 */
export function generateCatalogHTML(products) {
    if (!products || products.length === 0) return '';

    const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://ml-tlv.com';
    
    // Header for the catalog section
    let html = `
    <div class="catalog-container" dir="rtl" style="font-family: 'Open Sans', Arial, sans-serif; padding: 20px 0; background-color: #ffffff;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px;">
            <tr>
                <td style="padding: 0;">
                    <table border="0" cellpadding="0" cellspacing="0" width="100%">
    `;

    // Process items in rows (assuming 2 per row for best compatibility across mobile/desktop)
    for (let i = 0; i < products.length; i += 2) {
        html += `<tr>`;
        
        // Col 1
        html += renderProductCell(products[i], SITE_URL);
        
        // Col 2 (if exists)
        if (products[i + 1]) {
            html += renderProductCell(products[i + 1], SITE_URL);
        } else {
            // Empty cell to maintain layout
            html += `<td width="50%" style="padding: 10px;">&nbsp;</td>`;
        }
        
        html += `</tr>`;
    }

    html += `
                    </table>
                </td>
            </tr>
        </table>
    </div>
    `;

    return html;
}

function renderProductCell(product, siteUrl) {
    const productPrice = product.price_10ml || 0;
    const productUrl = `${siteUrl}/product/${product.slug || product.id}`;
    const name = product.model_he || product.model || '';
    const brand = product.brand_he || product.brand || '';
    const image = product.image_url || 'https://ml-tlv.com/placeholder.png';

    return `
    <td width="50%" valign="top" style="padding: 10px; border: 1px solid #f0f0f0; border-radius: 15px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
            <tr>
                <td align="center" style="padding-bottom: 10px; height: 180px; vertical-align: middle;">
                    <a href="${productUrl}" target="_blank" style="text-decoration: none;">
                        <img src="${image}" alt="${name}" width="150" style="display: block; width: auto; max-width: 150px; height: auto; max-height: 160px; border-radius: 10px; margin: 0 auto;">
                    </a>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 5px 0;">
                    <div style="font-size: 14px; font-weight: bold; color: #111111; line-height: 1.2;">${brand}</div>
                    <div style="font-size: 12px; color: #666666; margin-top: 2px;">${name}</div>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding: 5px 0;">
                    <div style="font-size: 14px; font-weight: 800; color: #2563eb;">החל מ-₪${productPrice}</div>
                </td>
            </tr>
            <tr>
                <td align="center" style="padding-top: 10px;">
                    <a href="${productUrl}" target="_blank" style="display: inline-block; padding: 8px 16px; background-color: #000000; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 11px; font-weight: bold; text-transform: uppercase;">לפרטים ורכישה</a>
                </td>
            </tr>
        </table>
    </td>
    `;
}
