import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const trackId = searchParams.get('trackId');

        if (!trackId) {
            return NextResponse.json({ error: 'Missing trackId' }, { status: 400 });
        }

        // 1. Get Spotify Token
        const authRes = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
            },
            body: 'grant_type=client_credentials'
        });
        
        const authData = await authRes.json();
        
        // 2. Fetch Track details from Spotify to get precise Name and Artist
        const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: {
                'Authorization': 'Bearer ' + authData.access_token
            }
        });
        
        const trackData = await trackRes.json();
        const name = trackData.name || '';
        const artist = trackData.artists?.[0]?.name || '';
        const image = trackData.album?.images?.[0]?.url || '';
        
        // 3. Spotify deprecated their own preview URLs for most tracks.
        // We will fetch the preview URL from iTunes API using the song name and artist!
        let preview_url = trackData.preview_url; // Fallback to Spotify if they magically have it
        
        if (!preview_url && name && artist) {
            try {
                // Clean up name for better search (remove "Remastered", etc)
                const cleanName = name.split('-')[0].split('(')[0].trim();
                const searchQuery = `${cleanName} ${artist}`;
                const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(searchQuery)}&entity=song&limit=1`);
                
                if (itunesRes.ok) {
                    const itunesData = await itunesRes.json();
                    if (itunesData.results && itunesData.results.length > 0) {
                        preview_url = itunesData.results[0].previewUrl;
                    }
                }
            } catch (e) {
                console.error("iTunes fetch failed:", e);
            }
        }
        
        return NextResponse.json({ 
            preview_url: preview_url,
            name: name,
            artist: artist,
            image: image
        });

    } catch (error) {
        console.error('Spotify/iTunes preview fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
