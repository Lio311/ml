import { ImageResponse } from 'next/og';
import pool from "../../lib/db";
import fs from 'fs';
import path from 'path';

// Standard Metadata for OG Image
export const runtime = 'nodejs';
export const alt = 'Fragrance Sample';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }) {
    const { slug } = await params;

    // Fetch product data
    const res = await pool.query(`
        SELECT brand, brand_he, model, model_he, image_url 
        FROM products 
        WHERE slug = $1 OR id::text = $1 
        LIMIT 1
    `, [slug]);

    const product = res.rows[0];
    if (!product) {
        return new Response('Product not found', { status: 404 });
    }

    // Load Hebrew font safely
    const baseUrl = 'https://www.ml-tlv.com';
    let fontData = null;
    try {
        const fontUrl = `${baseUrl}/fonts/Narkiss%20Block%20Regular.ttf`;
        const fontRes = await fetch(fontUrl, { cache: 'force-cache' });
        if (fontRes.ok) {
            fontData = await fontRes.arrayBuffer();
        }
    } catch (e) {
        console.error("Font fetch error:", e);
    }

    let imageData;
    let fallbackLogo = true;

    if (product.image_url) {
        let imageUrl = product.image_url.startsWith('http') ? product.image_url : `${baseUrl}${product.image_url}`;
        
        if (imageUrl.toLowerCase().endsWith('.avif')) {
            imageUrl = imageUrl.replace(/\.avif$/i, '.jpg');
        }

        try {
            const response = await fetch(imageUrl);
            if (response.ok) {
                const buffer = await response.arrayBuffer();
                const contentType = response.headers.get('content-type') || 'image/jpeg';
                // Convert to base64 for reliable Satori rendering in Node.js
                imageData = `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
                fallbackLogo = false;
            }
        } catch (e) {
            console.error("Failed to fetch OG image:", imageUrl, e);
        }
    }

    const displayImage = !fallbackLogo ? imageData : `${baseUrl}/logo_v5.png`;

    const reverseRtl = (text) => {
        if (!text) return "";
        if (/[א-ת]/.test(text)) {
            return text.split(" ").reverse().map(word => {
                if (/[א-ת]/.test(word)) {
                    return word.split("").reverse().join("");
                }
                return word;
            }).join(" ");
        }
        return text;
    };

    const brandDisplay = reverseRtl(product.brand_he || product.brand);
    const modelDisplay = reverseRtl(product.model_he || product.model);
    const sloganDisplay = reverseRtl("דוגמיות בושם מקוריות");
    const priceDisplay = product.price_10ml ? `₪${product.price_10ml} / 10ml` : reverseRtl("לפרטים נוספים");

    const fontsConfig = fontData ? [{
        name: 'NarkissBlock',
        data: fontData,
        style: 'normal',
    }] : [];

    return new ImageResponse(
        (
            <div
                style={{
                    background: 'white',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '80px',
                    fontFamily: fontData ? 'NarkissBlock' : 'sans-serif',
                }}
            >
                {/* Product Image */}
                <div style={{ display: 'flex', width: '480px', height: '480px', justifyContent: 'center', alignItems: 'center' }}>
                    <img
                        src={displayImage}
                        alt="Product Image"
                        width={fallbackLogo ? "320" : "480"}
                        height={fallbackLogo ? "120" : "480"}
                        style={{ objectFit: 'contain' }}
                    />
                </div>

                {/* Details */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, textAlign: 'right', alignItems: 'flex-end', paddingLeft: '40px' }}>
                    <div style={{ display: 'flex', marginBottom: '30px' }}>
                        <img 
                            src={`${baseUrl}/logo_v5.png`} 
                            alt="Logo"
                            width="200" 
                            height="70" 
                            style={{ objectFit: 'contain' }} 
                        />
                    </div>
                    
                    <div style={{ fontSize: 72, fontWeight: 'bold', color: '#000', marginBottom: '15px' }}>
                        {brandDisplay}
                    </div>
                    <div style={{ fontSize: 48, color: '#444', marginBottom: '30px' }}>
                        {modelDisplay}
                    </div>

                    {/* Price section added */}
                    <div style={{ fontSize: 56, fontWeight: 'bold', color: '#000', marginBottom: '30px', display: 'flex' }}>
                        {priceDisplay}
                    </div>
                    
                    <div style={{ display: 'flex', borderTop: '2px solid #f0f0f0', paddingTop: '30px', width: '100%', justifyContent: 'flex-end' }}>
                        <div style={{ fontSize: 26, color: '#888', fontWeight: 'normal' }}>
                            {sloganDisplay}
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
            fonts: fontsConfig,
        }
    );
}
