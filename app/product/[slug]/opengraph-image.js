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

    // Load Hebrew font for rendering
    const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Narkiss Block Regular.ttf');
    let fontData;
    try {
        fontData = fs.readFileSync(fontPath);
    } catch (e) {
        // Fallback or handle error if font missing during build/runtime
        console.error("Font not found at", fontPath);
    }

    // Base URL for assets
    const baseUrl = 'https://www.ml-tlv.com';
    let imageData;
    let fallbackLogo = true;

    if (product.image_url) {
        let imageUrl = product.image_url.startsWith('http') ? product.image_url : `${baseUrl}${product.image_url}`;
        
        // Satori (engine behind next/og) does not support AVIF.
        // If it's an .avif file, especially from fimgs.net (Fragrantica),
        // we attempt to fetch its .jpg equivalent.
        if (imageUrl.toLowerCase().endsWith('.avif')) {
            imageUrl = imageUrl.replace(/\.avif$/i, '.jpg');
        }

        try {
            const response = await fetch(imageUrl);
            if (response.ok) {
                const buffer = await response.arrayBuffer();
                const contentType = response.headers.get('content-type');
                // Check if the content type is supported by Satori (PNG, JPG, SVG)
                if (contentType && (contentType.includes('png') || contentType.includes('jpeg') || contentType.includes('jpg') || contentType.includes('svg'))) {
                    imageData = `data:${contentType};base64,${Buffer.from(buffer).toString('base64')}`;
                    fallbackLogo = false;
                }
            }
        } catch (e) {
            console.error("Failed to fetch OG image:", imageUrl, e);
        }
    }

    // Default to a branded placeholder if image missing or unsupported
    const displayImage = !fallbackLogo ? imageData : `${baseUrl}/logo_v5.png`;

    return new ImageResponse(
        (
            <div
                style={{
                    background: 'white',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'row', // Left-to-right flex container
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '80px',
                    fontFamily: 'NarkissBlock',
                }}
            >
                {/* Product Image (Left Side) */}
                <div style={{ display: 'flex', width: '480px', height: '480px', justifyContent: 'center', alignItems: 'center' }}>
                    <img
                        src={displayImage}
                        width={fallbackLogo ? "320" : "480"}
                        height={fallbackLogo ? "120" : "480"}
                        style={{ objectFit: 'contain' }}
                    />
                </div>

                {/* Product Details (Right Side) */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, textAlign: 'right', alignItems: 'flex-end', paddingLeft: '40px' }}>
                    <div style={{ display: 'flex', marginBottom: '40px' }}>
                        <img 
                            src={`${baseUrl}/logo_v5.png`} 
                            width="200" 
                            height="70" 
                            style={{ objectFit: 'contain' }} 
                        />
                    </div>
                    
                    <div style={{ fontSize: 72, fontWeight: 'bold', color: '#000', marginBottom: '15px', direction: 'rtl' }}>
                        {product.brand_he || product.brand}
                    </div>
                    <div style={{ fontSize: 48, color: '#444', marginBottom: '40px', direction: 'rtl' }}>
                        {product.model_he || product.model}
                    </div>
                    
                    <div style={{ display: 'flex', borderTop: '2px solid #f0f0f0', paddingTop: '30px', width: '100%', justifyContent: 'flex-end' }}>
                        <div style={{ fontSize: 26, color: '#888', fontWeight: 'normal' }}>
                            יוקרה בחתיכות קטנות
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            ...size,
            fonts: [
                {
                    name: 'NarkissBlock',
                    data: fontData,
                    style: 'normal',
                },
            ],
        }
    );
}
