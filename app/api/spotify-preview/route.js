import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const trackId = searchParams.get('trackId');

        if (!trackId) {
            return NextResponse.json({ error: 'Missing trackId' }, { status: 400 });
        }

        const authRes = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Authorization': 'Basic ' + Buffer.from(process.env.SPOTIFY_CLIENT_ID + ':' + process.env.SPOTIFY_CLIENT_SECRET).toString('base64')
            },
            body: 'grant_type=client_credentials'
        });
        
        const authData = await authRes.json();
        
        const trackRes = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
            headers: {
                'Authorization': 'Bearer ' + authData.access_token
            }
        });
        
        const trackData = await trackRes.json();
        
        return NextResponse.json({ 
            preview_url: trackData.preview_url,
            name: trackData.name,
            artist: trackData.artists?.[0]?.name,
            image: trackData.album?.images?.[0]?.url
        });

    } catch (error) {
        console.error('Spotify preview fetch error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
