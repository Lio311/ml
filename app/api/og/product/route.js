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

        // Product image URL handling
        if (imgUrl) {
            if (!imgUrl.startsWith('http')) {
                imgUrl = `${baseUrl}${imgUrl}`;
            }
            if (imgUrl.includes('fimgs.net')) {
                const cleanUrl = imgUrl.replace(/^https?:\/\//, '');
                imgUrl = `https://images.weserv.nl/?url=${encodeURIComponent(cleanUrl)}&w=640&q=80&bg=white&output=jpg`;
            }
        }

        // Fetch ArrayBuffers
        let fontData = null;
        let logoData = null;
        let productData = null;

        try {
            const fontUrl = new URL('../../../../public/fonts/Narkiss Block Regular.ttf', import.meta.url);
            fontData = await fetch(fontUrl).then((res) => res.arrayBuffer());
        } catch (e) { console.error('Font read error:', e); }

        try {
            const logoUrl = new URL('../../../../public/logo_v5.png', import.meta.url);
            logoData = await fetch(logoUrl).then((res) => res.arrayBuffer());
        } catch (e) { console.error('Logo read error:', e); }

        if (imgUrl) {
            try {
                const productRes = await fetch(imgUrl, {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
                        'Accept': 'image/jpeg,image/png,image/webp,*/*;q=0.8',
                    },
                    next: { revalidate: 3600 }
                });
                if (productRes.ok) {
                    productData = await productRes.arrayBuffer();
                } else {
                    console.error('Failed to fetch product image:', productRes.status);
                }
            } catch (err) { console.error('Fetch err:', err); }
        }

        if (searchParams.get('debug') === '1') {
            return new Response(JSON.stringify({
                imgUrl,
                baseUrl,
                hasFont: fontData ? fontData.byteLength : 0,
                hasLogo: logoData ? logoData.byteLength : 0,
                hasProduct: productData ? productData.byteLength : 0
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
                    {/* Main Container */}
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        width: '1100px',
                        height: '550px',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0 40px',
                    }}>
                        {/* Left Side: Product Image */}
                        <div style={{
                            display: 'flex',
                            width: '450px',
                            height: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}>
                            {productData ? (
                                <img
                                    src={productData}
                                    alt="Product"
                                    style={{
                                        height: '460px',
                                        width: '345px',
                                        objectFit: 'contain',
                                    }}
                                />
                            ) : null}
                        </div>

                        {/* Right Side: Text and Prices */}
                        <div style={{
                            display: 'flex',
                            flexDirection: 'column',
                            width: '550px',
                            height: '100%',
                            justifyContent: 'center',
                            alignItems: 'center',
                            textAlign: 'center',
                        }}>
                            {/* Logo */}
                            {logoData ? (
                                <img
                                    src={logoData}
                                    alt="Logo"
                                    style={{
                                        width: '140px',
                                        height: '46px',
                                        objectFit: 'contain',
                                        marginBottom: '20px'
                                    }}
                                />
                            ) : null}

                            {/* Brand */}
                            <div style={{
                                fontSize: 56,
                                fontWeight: 'bold',
                                color: '#000',
                                marginBottom: '8px',
                                display: 'flex',
                                textAlign: 'center',
                            }}>
                                {brandDisplay}
                            </div>

                            {/* Model */}
                            <div style={{
                                fontSize: 40,
                                color: '#444',
                                marginBottom: '40px',
                                display: 'flex',
                                textAlign: 'center',
                            }}>
                                {modelDisplay}
                            </div>

                            {/* Prices by Sizes (Horizontal Row) */}
                            <div style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'center',
                                alignItems: 'center',
                                width: '100%',
                            }}>
                                {p10 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 20px' }}>
                                        <div style={{ fontSize: 44, fontWeight: 'bold', color: '#000', display: 'flex' }}>
                                            {'\u20AA'}{p10}
                                        </div>
                                        <div style={{ fontSize: 24, color: '#666', display: 'flex' }}>
                                            10ml
                                        </div>
                                    </div>
                                ) : null}
                                {p5 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 20px' }}>
                                        <div style={{ fontSize: 44, fontWeight: 'bold', color: '#000', display: 'flex' }}>
                                            {'\u20AA'}{p5}
                                        </div>
                                        <div style={{ fontSize: 24, color: '#666', display: 'flex' }}>
                                            5ml
                                        </div>
                                    </div>
                                ) : null}
                                {p2 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', margin: '0 20px' }}>
                                        <div style={{ fontSize: 44, fontWeight: 'bold', color: '#000', display: 'flex' }}>
                                            {'\u20AA'}{p2}
                                        </div>
                                        <div style={{ fontSize: 24, color: '#666', display: 'flex' }}>
                                            2ml
                                        </div>
                                    </div>
                                ) : null}
                            </div>

                            {/* Divider */}
                            <div style={{
                                width: '100%',
                                height: '2px',
                                background: '#eee',
                                marginTop: '30px',
                                marginBottom: '20px'
                            }}></div>

                            {/* Slogan */}
                            <div style={{
                                fontSize: 28,
                                color: '#888',
                                display: 'flex',
                                textAlign: 'center',
                            }}>
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
