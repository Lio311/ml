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
    const imageUrl = product.image_url 
        ? (product.image_url.startsWith('http') ? product.image_url : `${baseUrl}${product.image_url}`)
        : `${baseUrl}/logo_v5.png`;

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
                    fontFamily: 'NarkissBlock',
                }}
            >
                {/* Product Details (Right Side for RTL feel) */}
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1, textAlign: 'right', alignItems: 'flex-end' }}>
                    <img 
                        src={`${baseUrl}/logo_v5.png`} 
                        width="180" 
                        height="60" 
                        style={{ marginBottom: '60px', objectFit: 'contain' }} 
                    />
                    <div style={{ fontSize: 72, fontWeight: 'bold', color: '#000', marginBottom: '15px' }}>
                        {product.brand_he || product.brand}
                    </div>
                    <div style={{ fontSize: 48, color: '#555' }}>
                        {product.model_he || product.model}
                    </div>
                    <div style={{ fontSize: 24, color: '#888', marginTop: '60px' }}>
                        יוקרה בחתיכות קטנות
                    </div>
                </div>

                {/* Product Image (Left Side) */}
                <div style={{ display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <img
                        src={imageUrl}
                        width="480"
                        height="480"
                        style={{ objectFit: 'contain' }}
                    />
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
