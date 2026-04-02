import { ImageResponse } from 'next/og';

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

        return new ImageResponse(
            (
                <div
                    style={{
                        height: '100%',
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: 'white',
                        padding: '40px',
                    }}
                >
                    <img
                        src={decodedUrl}
                        alt="Product Image"
                        style={{
                            maxHeight: '80%',
                            maxWidth: '80%',
                            objectFit: 'contain',
                            borderRadius: '10px',
                        }}
                    />
                </div>
            ),
            {
                width: 1200,
                height: 630,
            }
        );
    } catch (e) {
        console.error("OG Image Error:", e);
        return new Response(`Failed to generate the image`, {
            status: 500,
        });
    }
}
