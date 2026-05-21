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
        // Step 1: Get token
        const tokenRes = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64")
            },
            body: "grant_type=client_credentials"
        });

        if (!tokenRes.ok) {
            return NextResponse.json({ error: 'Token failed', status: tokenRes.status });
        }

        const tokenData = await tokenRes.json();
        const token = tokenData.access_token;

        // Step 2: Search
        const searchRes = await fetch(`https://api.spotify.com/v1/search?q=samba&type=track&limit=5`, {
            headers: { "Authorization": `Bearer ${token}` }
        });

        const searchText = await searchRes.text();

        return NextResponse.json({ 
            tokenOk: true,
            searchStatus: searchRes.status,
            searchOk: searchRes.ok,
            searchResponse: searchText.substring(0, 500)
        });
    } catch (err) {
        return NextResponse.json({ error: err.message });
    }
}
