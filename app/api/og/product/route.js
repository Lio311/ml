import { ImageResponse } from 'next/og';
import * as Sentry from "@sentry/nextjs";

export const runtime = 'edge';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const imageUrl = searchParams.get('url');

        if (!imageUrl) {
            return new Response('Missing image URL', { status: 400 });
        }

        // Decode URL in case it's double encoded
        const decodedUrl = decodeURIComponent(imageUrl);

        // Fetch image to ensure we have it and to determine content type
        let imageDataUrl = decodedUrl;
        try {
            const imageRes = await fetch(decodedUrl);
            if (imageRes.ok) {
                const contentType = imageRes.headers.get('content-type') || 'image/png';
                const arrayBuffer = await imageRes.arrayBuffer();
                
                // Edge-compatible base64 conversion (no Buffer)
                const uint8Array = new Uint8Array(arrayBuffer);
                let binary = '';
                for (let i = 0; i < uint8Array.length; i++) {
                    binary += String.fromCharCode(uint8Array[i]);
                }
                const base64 = btoa(binary);
                imageDataUrl = `data:${contentType};base64,${base64}`;
            }
        } catch (fetchErr) {
            console.error("Failed to fetch image for OG:", fetchErr);
            Sentry.captureException(fetchErr);
            // Fallback to original URL if fetch fails
        }

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '630px',
                        width: '1200px',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'white', // Guaranteed white background
                        position: 'relative',
                    }}
                >
                    {/* Extra background layer to guarantee no transparency issues in some platforms */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'white',
                        zIndex: -1,
                    }} />

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: '100%',
                        height: '100%',
                        padding: '40px',
                    }}>
                        <img
                            src={imageDataUrl}
                            alt="Product"
                            style={{
                                height: '550px',
                                width: 'auto',
                                objectFit: 'contain',
                            }}
                        />
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
