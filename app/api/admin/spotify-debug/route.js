import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
        return NextResponse.json({ 
            error: 'Missing env vars',
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret
        });
    }

    try {
        const res = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64")
            },
            body: "grant_type=client_credentials"
        });

        const text = await res.text();
        return NextResponse.json({ 
            status: res.status,
            ok: res.ok,
            response: text.substring(0, 200),
            hasClientId: true,
            hasClientSecret: true,
            clientIdLength: clientId.length,
            clientSecretLength: clientSecret.length
        });
    } catch (err) {
        return NextResponse.json({ error: err.message });
    }
}
