import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const q = searchParams.get('q');

    if (!q && !id) {
        return NextResponse.json({ tracks: [] });
    }

    try {
        const tracksPath = path.join(process.cwd(), 'app', 'lib', 'spotify_tracks.json');
        const tracks = JSON.parse(fs.readFileSync(tracksPath, 'utf8'));

        if (id) {
            const track = tracks.find(t => t.id === id);
            return NextResponse.json({ track: track || null });
        }

        const queryLower = q.toLowerCase();
        
        const results = tracks
            .filter(t => 
                (t.name && t.name.toLowerCase().includes(queryLower)) || 
                (t.artist && t.artist.toLowerCase().includes(queryLower))
            )
            .slice(0, 20);

        return NextResponse.json({ tracks: results });
    } catch(e) {
        console.error("Failed to load spotify tracks for search", e);
        return NextResponse.json({ tracks: [] }, { status: 500 });
    }
}
