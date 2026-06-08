import { ImageResponse } from 'next/og';

export const runtime = 'edge';
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

        // Load Font from Edge
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

        function arrayBufferToBase64(buffer) {
            let binary = '';
            const bytes = new Uint8Array(buffer);
            const len = bytes.byteLength;
            for (let i = 0; i < len; i++) {
                binary += String.fromCharCode(bytes[i]);
            }
            return btoa(binary);
        }

        // Product image - proxy through images.weserv.nl to bypass Fragrantica IP blocks
        let productBase64 = null;
        if (imgUrl) {
            if (!imgUrl.startsWith('http')) {
                imgUrl = `${baseUrl}${imgUrl}`;
            }
            if (imgUrl.toLowerCase().endsWith('.avif')) {
                imgUrl = imgUrl.replace(/\.avif$/i, '.jpg');
            }
            if (imgUrl.includes('fimgs.net')) {
                const cleanUrl = imgUrl.replace(/^https?:\/\//, '');
                imgUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&w=640&q=80`;
            }
            try {
                const res = await fetch(imgUrl);
                if (res.ok) {
                    const buf = await res.arrayBuffer();
                    productBase64 = `data:image/jpeg;base64,${arrayBufferToBase64(buf)}`;
                }
            } catch(e) {
                console.error("Failed to fetch product image:", e);
            }
        }

        const logoUrl = `${baseUrl}/logo_v5.png`;
        let logoBase64 = null;
        try {
            const res = await fetch(logoUrl);
            if (res.ok) {
                const buf = await res.arrayBuffer();
                logoBase64 = `data:image/png;base64,${arrayBufferToBase64(buf)}`;
            }
        } catch(e) {
            console.error("Failed to fetch logo:", e);
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
                    }}>
                        {productBase64 ? (
                            <img
                                src={productBase64}
                                width="440"
                                height="500"
                                style={{ objectFit: 'contain' }}
                            />
                        ) : logoBase64 ? (
                            <img
                                src={logoBase64}
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
                        {logoBase64 ? (
                            <div style={{ display: 'flex', marginBottom: '24px' }}>
                                <img
                                    src={logoBase64}
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
