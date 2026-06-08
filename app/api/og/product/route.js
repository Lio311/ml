import { ImageResponse } from 'next/og';
import * as Sentry from "@sentry/nextjs";

export const runtime = 'edge';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get('url');
        const name = searchParams.get('name') || '';
        const brand = searchParams.get('brand') || '';
        const price = searchParams.get('price') || '';

        if (!imageUrl) {
            return new Response('Missing image URL', { status: 400 });
        }

        const decodedUrl = decodeURIComponent(imageUrl);

        let imageDataUrl = decodedUrl;
        try {
            const imageRes = await fetch(decodedUrl);
            if (imageRes.ok) {
                const contentType = imageRes.headers.get('content-type') || 'image/png';
                const arrayBuffer = await imageRes.arrayBuffer();
                
                const uint8Array = new Uint8Array(arrayBuffer);
                let binary = '';
                const CHUNK_SIZE = 0x8000;
                for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
                    binary += String.fromCharCode.apply(null, uint8Array.subarray(i, i + CHUNK_SIZE));
                }
                const base64 = btoa(binary);
                imageDataUrl = `data:${contentType};base64,${base64}`;
            }
        } catch (fetchErr) {
            console.error("Failed to fetch image for OG:", fetchErr);
            Sentry.captureException(fetchErr);
        }

        // Modern UI Design
        return new ImageResponse(
            (
                <div
                    style={{
                        height: '630px',
                        width: '1200px',
                        display: 'flex',
                        flexDirection: 'row',
                        backgroundColor: '#FAFAFA',
                        fontFamily: 'sans-serif',
                    }}
                >
                    {/* Left Side: Product Image (Larger) */}
                    <div style={{
                        width: '50%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: '#FFFFFF',
                        borderRight: '1px solid #EAEAEA',
                    }}>
                        <img
                            src={imageDataUrl}
                            alt="Product"
                            style={{
                                height: '500px',
                                width: '500px',
                                objectFit: 'contain',
                            }}
                        />
                    </div>

                    {/* Right Side: Details */}
                    <div style={{
                        width: '50%',
                        height: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'center',
                        padding: '60px',
                        backgroundColor: '#FAFAFA',
                    }}>
                        {brand && (
                            <div style={{
                                fontSize: '32px',
                                fontWeight: '600',
                                color: '#666666',
                                textTransform: 'uppercase',
                                letterSpacing: '4px',
                                marginBottom: '20px',
                            }}>
                                {brand}
                            </div>
                        )}
                        
                        <div style={{
                            fontSize: '64px',
                            fontWeight: '900',
                            color: '#000000',
                            lineHeight: '1.2',
                            marginBottom: '40px',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                        }}>
                            {name}
                        </div>

                        {price && (
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                marginTop: '20px',
                            }}>
                                <div style={{
                                    fontSize: '80px',
                                    fontWeight: '900',
                                    color: '#000000',
                                }}>
                                    {price} ₪
                                </div>
                                <div style={{
                                    fontSize: '32px',
                                    fontWeight: '600',
                                    color: '#888888',
                                    marginLeft: '16px',
                                    marginTop: '20px',
                                }}>
                                    / 10ml
                                </div>
                            </div>
                        )}

                        <div style={{
                            marginTop: 'auto',
                            display: 'flex',
                            alignItems: 'center',
                        }}>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                backgroundColor: '#000000',
                                color: '#FFFFFF',
                                padding: '16px 32px',
                                borderRadius: '40px',
                                fontSize: '28px',
                                fontWeight: 'bold',
                            }}>
                                100% Original Decants
                            </div>
                        </div>
                    </div>
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (e) {
        console.error("OG Image Error:", e);
        Sentry.captureException(e);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
