import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

let spotifyToken = null;
let tokenExpiration = 0;

async function getSpotifyToken() {
    if (spotifyToken && Date.now() < tokenExpiration) return spotifyToken;
    
    const clientId = process.env.SPOTIFY_CLIENT_ID;
    const clientSecret = process.env.SPOTIFY_CLIENT_SECRET;
    
    if (!clientId || !clientSecret) {
        console.error("Missing SPOTIFY_CLIENT_ID or SPOTIFY_CLIENT_SECRET");
        return null;
    }
    
    try {
        const res = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            cache: "no-store",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "Authorization": "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64")
            },
            body: "grant_type=client_credentials"
        });
        
        if (!res.ok) {
            console.error("Failed to fetch Spotify token", await res.text());
            return null;
        }
        
        const data = await res.json();
        spotifyToken = data.access_token;
        tokenExpiration = Date.now() + (data.expires_in - 60) * 1000;
        return spotifyToken;
    } catch (error) {
        console.error("Error fetching Spotify token", error);
        return null;
    }
}

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q');
    
    if (!q) {
        return NextResponse.json({ tracks: [] });
    }

    try {
        const token = await getSpotifyToken();
        if (!token) {
            return NextResponse.json({ tracks: [] });
        }

        const res = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=20`, {
            cache: "no-store",
            headers: { "Authorization": `Bearer ${token}` }
        });
        
        if (!res.ok) {
            console.error("Spotify API error", await res.text());
            return NextResponse.json({ tracks: [] });
        }
        
        const data = await res.json();
        if (!data.tracks || !data.tracks.items) {
            return NextResponse.json({ tracks: [] });
        }

        const formattedTracks = data.tracks.items.map(t => ({
            id: t.id,
            name: t.name,
            artist: t.artists.map(a => a.name).join(', ')
        }));

        return NextResponse.json({ tracks: formattedTracks });
    } catch (error) {
        console.error('Search error:', error);
        return NextResponse.json({ tracks: [] });
    }
}
