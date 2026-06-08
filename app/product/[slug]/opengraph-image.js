import { ImageResponse } from 'next/og';
import pool from "../../lib/db";

// Standard Metadata for OG Image
export const runtime = 'nodejs';
export const alt = 'Fragrance Sample';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/**
 * Helper: fetch an image and return it as a data:... URI string.
 * Returns null on any failure so the caller can gracefully degrade.
 */
async function fetchAsDataUri(url) {
    try {
        const res = await fetch(url);
        if (!res.ok) return null;
        const buffer = await res.arrayBuffer();
        const ct = res.headers.get('content-type') || 'image/png';
        return `data:${ct};base64,${Buffer.from(buffer).toString('base64')}`;
    } catch {
        return null;
    }
}

export default async function Image({ params }) {
    const { slug } = await params;

    // ── 1. DB query ───────────────────────────────────────────────
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

    // ── 2. Load assets (font, logo, product image) ────────────────
    const baseUrl = 'https://www.ml-tlv.com';

    // Font — fetched as ArrayBuffer (Satori fonts API accepts ArrayBuffer)
    let fontData = null;
    try {
        const fontRes = await fetch(
            `${baseUrl}/fonts/Narkiss%20Block%20Regular.ttf`,
            { cache: 'force-cache' }
        );
        if (fontRes.ok) fontData = await fontRes.arrayBuffer();
    } catch { /* font is optional */ }

    // Logo — as base64 data URI
    const logoDataUri = await fetchAsDataUri(`${baseUrl}/logo_v5.png`);

    // Product image — as base64 data URI
    let productImageUri = null;
    if (product.image_url) {
        let imgUrl = product.image_url.startsWith('http')
            ? product.image_url
            : `${baseUrl}${product.image_url}`;
        // Satori cannot decode AVIF; try the .jpg equivalent
        if (imgUrl.toLowerCase().endsWith('.avif')) {
            imgUrl = imgUrl.replace(/\.avif$/i, '.jpg');
        }
        productImageUri = await fetchAsDataUri(imgUrl);
    }

    // ── 3. Prepare text (reverse Hebrew words for Satori) ─────────
    const reverseRtl = (text) => {
        if (!text) return '';
        if (/[א-ת]/.test(text)) {
            return text.split(' ').reverse().map(w =>
                /[א-ת]/.test(w) ? w.split('').reverse().join('') : w
            ).join(' ');
        }
        return text;
    };

    const brandDisplay = reverseRtl(product.brand_he || product.brand);
    const modelDisplay = reverseRtl(product.model_he || product.model);
    const sloganDisplay = reverseRtl('דוגמיות בושם מקוריות');

    // Build price items (only sizes that exist)
    const prices = [];
    if (product.price_10ml) prices.push({ label: '10ml', price: product.price_10ml });
    if (product.price_5ml)  prices.push({ label: '5ml',  price: product.price_5ml });
    if (product.price_2ml)  prices.push({ label: '2ml',  price: product.price_2ml });

    // ── 4. Fonts config ───────────────────────────────────────────
    const fontsConfig = fontData
        ? [{ name: 'NarkissBlock', data: fontData, style: 'normal' }]
        : [];

    // ── 5. Render ─────────────────────────────────────────────────
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
                {/* ── Left: Product Image ── */}
                <div style={{
                    display: 'flex',
                    width: '440px',
                    height: '500px',
                    justifyContent: 'center',
                    alignItems: 'center',
                }}>
                    {productImageUri ? (
                        <img
                            src={productImageUri}
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

                {/* ── Right: Details ── */}
                <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    flex: 1,
                    alignItems: 'flex-end',
                    paddingLeft: '40px',
                }}>
                    {/* Logo */}
                    {logoDataUri && (
                        <div style={{ display: 'flex', marginBottom: '24px' }}>
                            <img
                                src={logoDataUri}
                                width="180"
                                height="65"
                                style={{ objectFit: 'contain' }}
                            />
                        </div>
                    )}

                    {/* Brand */}
                    <div style={{
                        fontSize: 64,
                        fontWeight: 'bold',
                        color: '#000',
                        marginBottom: '10px',
                        textAlign: 'right',
                    }}>
                        {brandDisplay}
                    </div>

                    {/* Model */}
                    <div style={{
                        fontSize: 42,
                        color: '#444',
                        marginBottom: '28px',
                        textAlign: 'right',
                    }}>
                        {modelDisplay}
                    </div>

                    {/* Prices */}
                    {prices.length > 0 && (
                        <div style={{
                            display: 'flex',
                            flexDirection: 'row',
                            gap: '40px',
                            marginBottom: '28px',
                            justifyContent: 'flex-end',
                            width: '100%',
                        }}>
                            {prices.map((p) => (
                                <div key={p.label} style={{
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                }}>
                                    <div style={{ fontSize: 42, fontWeight: 'bold', color: '#000' }}>
                                        ₪{p.price}
                                    </div>
                                    <div style={{ fontSize: 24, color: '#666' }}>
                                        {p.label}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Slogan */}
                    <div style={{
                        display: 'flex',
                        borderTop: '2px solid #eee',
                        paddingTop: '24px',
                        width: '100%',
                        justifyContent: 'flex-end',
                    }}>
                        <div style={{ fontSize: 24, color: '#888' }}>
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
