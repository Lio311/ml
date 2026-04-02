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

        // Fetch image buffer to ensure it loads before rendering
        // This avoids issues with Satori failing to fetch during rendering
        let imageBuffer;
        try {
            const imageRes = await fetch(decodedUrl);
            if (imageRes.ok) {
                imageBuffer = await imageRes.arrayBuffer();
            }
        } catch (fetchErr) {
            console.error("Failed to fetch image for OG:", fetchErr);
            Sentry.captureException(fetchErr);
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
                        backgroundColor: 'white', // Ensure absolute white background
                        position: 'relative',
                    }}
                >
                    {/* Background layer to guarantee no transparency */}
                    <div style={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'white',
                        zIndex: -1,
                    }} />

                    {imageBuffer ? (
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            height: '100%',
                            padding: '40px',
                        }}>
                            <img
                                src={imageBuffer}
                                alt="Product"
                                style={{
                                    height: '550px',
                                    width: 'auto',
                                    objectFit: 'contain',
                                }}
                            />
                        </div>
                    ) : (
                        <div style={{ fontSize: '100px' }}>🧴</div>
                    )}
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
