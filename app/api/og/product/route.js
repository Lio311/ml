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

        // Decode URL - absolute URLs are now guaranteed by the caller
        const decodedUrl = decodeURIComponent(imageUrl);

        let imageDataUrl = decodedUrl;
        try {
            const imageRes = await fetch(decodedUrl);
            if (imageRes.ok) {
                const contentType = imageRes.headers.get('content-type') || 'image/png';
                const arrayBuffer = await imageRes.arrayBuffer();
                
                // Optimized Edge-compatible base64 conversion
                const uint8Array = new Uint8Array(arrayBuffer);
                let binary = '';
                const CHUNK_SIZE = 0x8000; // 32KB chunks to avoid stack limits
                for (let i = 0; i < uint8Array.length; i += CHUNK_SIZE) {
                    binary += String.fromCharCode.apply(null, uint8Array.subarray(i, i + CHUNK_SIZE));
                }
                const base64 = btoa(binary);
                imageDataUrl = `data:${contentType};base64,${base64}`;
            }
        } catch (fetchErr) {
            console.error("Failed to fetch image for OG:", fetchErr);
            Sentry.captureException(fetchErr);
            // If fetch fails, we still have the original URL as fallback
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
                        backgroundColor: 'white',
                        position: 'relative',
                    }}
                >
                    {/* Background layer */}
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
