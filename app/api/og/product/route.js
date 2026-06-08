import { ImageResponse } from 'next/og';
import fs from 'fs';
import path from 'path';

export const alt = 'Fragrance Sample';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        
        const brand = searchParams.get('brand') || '';
        const model = searchParams.get('model') || '';
        const p10 = searchParams.get('p10') || '';
        const p5 = searchParams.get('p5') || '';
        const p2 = searchParams.get('p2') || '';
        let imgUrl = searchParams.get('img') || '';

        const baseUrl = 'https://www.ml-tlv.com';

        // Load Font from Local Filesystem (Node.js)
        let fontData = null;
        try {
            const fontPath = path.join(process.cwd(), 'public', 'fonts', 'Narkiss Block Regular.ttf');
            if (fs.existsSync(fontPath)) {
                fontData = fs.readFileSync(fontPath).buffer;
            }
        } catch (e) {
            console.error('Font read error:', e);
        }

        // Load Logo from Local Filesystem (Node.js)
        let logoData = null;
        try {
            const logoPath = path.join(process.cwd(), 'public', 'logo_v5.png');
            if (fs.existsSync(logoPath)) {
                logoData = fs.readFileSync(logoPath).buffer;
            }
        } catch (e) {
            console.error('Logo read error:', e);
        }

        // Fetch Product Image manually to ensure proper headers and ArrayBuffer conversion
        let productData = null;
        if (imgUrl) {
            if (!imgUrl.startsWith('http')) {
                imgUrl = `${baseUrl}${imgUrl}`;
            }
            if (imgUrl.toLowerCase().endsWith('.avif')) {
                imgUrl = imgUrl.replace(/\.avif$/i, '.jpg');
            }
            if (imgUrl.includes('fimgs.net')) {
                const cleanUrl = imgUrl.replace(/^https?:\/\//, '');
                imgUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&w=640&q=80&output=png`;
            }
            try {
                const res = await fetch(imgUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
                    }
                });
                if (res.ok) {
                    productData = await res.arrayBuffer();
                }
            } catch(e) {
                console.error('Product image fetch error:', e);
            }
        }

        if (searchParams.get('debug') === '1') {
            return new Response(JSON.stringify({
                imgUrl,
                baseUrl,
                hasFont: !!fontData,
                hasLogo: !!logoData,
                hasProduct: !!productData
            }), { headers: { 'Content-Type': 'application/json' } });
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

        const brandDisplay = reverseRtl(brand);
        const modelDisplay = reverseRtl(model);
        const sloganDisplay = reverseRtl('דוגמיות בושם מקוריות');

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
                        flexDirection: 'column',
                    }}>
                        {productData ? (
                            <img
                                src={productData}
                                width="440"
                                height="500"
                                style={{ objectFit: 'contain' }}
                            />
                        ) : logoData ? (
                            <img
                                src={logoData}
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
                        {logoData ? (
                            <div style={{ display: 'flex', marginBottom: '24px' }}>
                                <img
                                    src={logoData}
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
            { width: 1200, height: 630 }
        );
    }
}
