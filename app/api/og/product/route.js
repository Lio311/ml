import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
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

        // Load Font from Local Filesystem (Edge)
        let fontData = null;
        try {
            const fontUrl = new URL('../../../../public/fonts/Narkiss Block Regular.ttf', import.meta.url);
            fontData = await fetch(fontUrl).then((res) => res.arrayBuffer());
        } catch (e) {
            console.error('Font read error:', e);
        }

        // Load Logo from Local Filesystem (Edge)
        let logoData = null;
        try {
            const logoUrl = new URL('../../../../public/logo_v5.png', import.meta.url);
            logoData = await fetch(logoUrl).then((res) => res.arrayBuffer());
        } catch (e) {
            console.error('Logo read error:', e);
        }

        // Product image URL handling
        if (imgUrl) {
            if (!imgUrl.startsWith('http')) {
                imgUrl = `${baseUrl}${imgUrl}`;
            }
            if (imgUrl.toLowerCase().endsWith('.avif')) {
                imgUrl = imgUrl.replace(/\.avif$/i, '.jpg');
            }
            if (imgUrl.includes('fimgs.net')) {
                const cleanUrl = imgUrl.replace(/^https?:\/\//, '');
                imgUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&w=640&q=80&output=jpg`;
            }
        }

        if (searchParams.get('debug') === '1') {
            return new Response(JSON.stringify({
                imgUrl,
                baseUrl,
                hasFont: fontData ? fontData.byteLength : 0,
                hasLogo: logoData ? logoData.byteLength : 0,
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
                        justifyContent: 'center',
                        fontFamily: fontData ? 'NarkissBlock' : 'sans-serif',
                    }}
                >
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '60px',
                        width: '100%',
                        maxWidth: '900px',
                    }}>
                        {/* Left: Product Image */}
                        <div style={{
                            display: 'flex',
                            width: '400px',
                            height: '500px',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }}>
                            {imgUrl ? (
                                <img
                                    src={imgUrl}
                                    alt="Product"
                                    style={{
                                        height: '500px',
                                        width: 'auto',
                                        maxWidth: '400px',
                                        objectFit: 'contain'
                                    }}
                                />
                            ) : logoData ? (
                                <img
                                    src={logoData}
                                    alt="Logo"
                                    style={{
                                        width: '300px',
                                        height: '110px',
                                        objectFit: 'contain'
                                    }}
                                />
                            ) : null}
                        </div>

                        {/* Right: Details */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'flex-end',
                            justifyContent: 'center',
                            width: '400px',
                        }}>
                            {/* Logo */}
                            {logoData ? (
                                <div style={{ display: 'flex', marginBottom: '24px' }}>
                                    <img
                                        src={logoData}
                                        alt="Logo"
                                        style={{
                                            width: '180px',
                                            height: '65px',
                                            objectFit: 'contain'
                                        }}
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
