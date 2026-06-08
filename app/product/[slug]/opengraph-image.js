import { ImageResponse } from 'next/og';
import pool from "../../lib/db";

// Standard Metadata for OG Image
export const runtime = 'nodejs';
export const alt = 'Fragrance Sample';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Fetch an image and return it as a data:... URI string.
 * Only returns supported formats (png, jpeg, gif, svg).
 * Returns null on any failure.
 */
async function fetchAsDataUri(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const buffer = await res.arrayBuffer();
        const ct = res.headers.get('content-type') || 'image/png';
        // Only support formats Satori can render
        if (!ct.includes('png') && !ct.includes('jpeg') && !ct.includes('jpg') && !ct.includes('gif') && !ct.includes('svg')) {
            return null;
        }
        const base64 = Buffer.from(buffer).toString('base64');
        return `data:${ct};base64,${base64}`;
    } catch (e) {
        console.error('fetchAsDataUri failed:', url, e);
        return null;
    }
}

export default async function Image({ params }) {
    try {
        const { slug } = await params;

        const res = await pool.query(`
            SELECT brand, brand_he, model, model_he, image_url,
                   price_2ml, price_5ml, price_10ml
            FROM products
            WHERE slug = $1 OR id::text = $1
            LIMIT 1
        `, [slug]);

        const product = res.rows[0];
        if (!product) {
            return new Response('Product not found', { status: 404 });
        }

        const baseUrl = 'https://www.ml-tlv.com';

        // Font (ArrayBuffer is correct for the fonts API)
        let fontData = null;
        try {
            const fontRes = await fetch(
                `${baseUrl}/fonts/Narkiss%20Block%20Regular.ttf`,
                { cache: 'force-cache' }
            );
            if (fontRes.ok) fontData = await fontRes.arrayBuffer();
        } catch (e) {
            console.error('Font fetch error:', e);
        }

        // Logo as data URI (from our own domain — always works)
        const logoDataUri = await fetchAsDataUri(`${baseUrl}/logo_v5.png`);

        // Product image — route through our own /_next/image proxy
        // to bypass Fragrantica/CDN blocking of Vercel serverless IPs
        let productImageSrc = null;
        if (product.image_url) {
            let imgUrl = product.image_url.startsWith('http')
                ? product.image_url
                : `${baseUrl}${product.image_url}`;
            // Satori cannot decode AVIF — try jpg equivalent
            if (imgUrl.toLowerCase().endsWith('.avif')) {
                imgUrl = imgUrl.replace(/\.avif$/i, '.jpg');
            }

            // Strategy 1: Try fetching directly (works for our own domain images)
            productImageSrc = await fetchAsDataUri(imgUrl);

            // Strategy 2: Route through /_next/image proxy (works for blocked external CDNs)
            if (!productImageSrc) {
                const proxyUrl = `${baseUrl}/_next/image?url=${encodeURIComponent(imgUrl)}&w=640&q=80`;
                productImageSrc = await fetchAsDataUri(proxyUrl);
            }

            // Strategy 3: Just pass the URL directly as last resort
            if (!productImageSrc) {
                productImageSrc = imgUrl;
            }
        }

        // Text helpers
        const reverseRtl = (text) => {
            if (!text) return '';
            if (/[א-ת]/.test(text)) {
                return text.split(' ').reverse().map(function(w) {
                    return /[א-ת]/.test(w) ? w.split('').reverse().join('') : w;
                }).join(' ');
            }
            return text;
        };

        const brandDisplay = reverseRtl(product.brand_he || product.brand);
        const modelDisplay = reverseRtl(product.model_he || product.model);
        const sloganDisplay = reverseRtl('דוגמיות בושם מקוריות');

        const p10 = product.price_10ml ? String(product.price_10ml) : null;
        const p5 = product.price_5ml ? String(product.price_5ml) : null;
        const p2 = product.price_2ml ? String(product.price_2ml) : null;

        const fontsConfig = fontData
            ? [{ name: 'NarkissBlock', data: fontData, style: 'normal' }]
            : [];

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
                        padding: '70px 80px',
                        fontFamily: fontData ? 'NarkissBlock' : 'sans-serif',
                    }}
                >
                    {/* Left: Product Image */}
                    <div style={{
                        display: 'flex',
                        width: '440px',
                        height: '500px',
                        justifyContent: 'center',
                        alignItems: 'center',
                    }}>
                        {productImageSrc ? (
                            <img
                                src={productImageSrc}
                                width="440"
                                height="500"
                                style={{ objectFit: 'contain' }}
                            />
                        ) : logoDataUri ? (
                            <img
                                src={logoDataUri}
                                width="300"
                                height="110"
                                style={{ objectFit: 'contain' }}
                            />
                        ) : null}
                    </div>

                    {/* Right: Details */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        flex: 1,
                        alignItems: 'flex-end',
                        paddingLeft: '40px',
                    }}>
                        {/* Logo */}
                        {logoDataUri ? (
                            <div style={{ display: 'flex', marginBottom: '24px' }}>
                                <img
                                    src={logoDataUri}
                                    width="180"
                                    height="65"
                                    style={{ objectFit: 'contain' }}
                                />
                            </div>
                        ) : null}

                        {/* Brand */}
                        <div style={{
                            fontSize: 64,
                            fontWeight: 'bold',
                            color: '#000',
                            marginBottom: '10px',
                            display: 'flex',
                        }}>
                            {brandDisplay}
                        </div>

                        {/* Model */}
                        <div style={{
                            fontSize: 42,
                            color: '#444',
                            marginBottom: '28px',
                            display: 'flex',
                        }}>
                            {modelDisplay}
                        </div>

                        {/* Prices */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            marginBottom: '28px',
                            justifyContent: 'flex-end',
                            width: '100%',
                        }}>
                            {p10 ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    marginLeft: '40px',
                                }}>
                                    <div style={{ fontSize: 42, fontWeight: 'bold', color: '#000', display: 'flex' }}>
                                        {'\u20AA'}{p10}
                                    </div>
                                    <div style={{ fontSize: 24, color: '#666', display: 'flex' }}>
                                        10ml
                                    </div>
                                </div>
                            ) : null}
                            {p5 ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    marginLeft: '40px',
                                }}>
                                    <div style={{ fontSize: 42, fontWeight: 'bold', color: '#000', display: 'flex' }}>
                                        {'\u20AA'}{p5}
                                    </div>
                                    <div style={{ fontSize: 24, color: '#666', display: 'flex' }}>
                                        5ml
                                    </div>
                                </div>
                            ) : null}
                            {p2 ? (
                                <div style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    marginLeft: '40px',
                                }}>
                                    <div style={{ fontSize: 42, fontWeight: 'bold', color: '#000', display: 'flex' }}>
                                        {'\u20AA'}{p2}
                                    </div>
                                    <div style={{ fontSize: 24, color: '#666', display: 'flex' }}>
                                        2ml
                                    </div>
                                </div>
                            ) : null}
                        </div>

                        {/* Slogan */}
                        <div style={{
                            display: 'flex',
                            borderTop: '2px solid #eee',
                            paddingTop: '24px',
                            width: '100%',
                            justifyContent: 'flex-end',
                        }}>
                            <div style={{ fontSize: 24, color: '#888', display: 'flex' }}>
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
    } catch (e) {
        console.error('OG Image generation error:', e);
        // Return a minimal valid image instead of crashing
        return new ImageResponse(
            (
                <div style={{
                    background: 'white',
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 48,
                    color: '#333',
                }}>
                    ml-tlv.com
                </div>
            ),
            { ...size }
        );
    }
}
