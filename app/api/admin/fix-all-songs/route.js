import { NextResponse } from 'next/server';
import { Pool } from 'pg';
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL || process.env.DATABASE_URL
});

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// WARNING: This route is unprotected for a one-time use, but ideally we'd pass a secret key.
export const maxDuration = 300; // Allow long execution on Vercel Pro (if applicable), though hobby is 10s or 60s. Wait, Vercel hobby is 10s max.

// Because of Vercel 10s timeout, we will fix them in batches of 5.
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get('limit') || 5;

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: 'No GEMINI_API_KEY' }, { status: 500 });

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    try {
        const tracksPath = path.join(process.cwd(), 'app', 'lib', 'spotify_tracks.json');
        const tracks = JSON.parse(fs.readFileSync(tracksPath, 'utf8'));
        
        // Find products that still have the old badly assigned songs.
        // Wait, since all products were assigned badly, maybe just pick products where a custom flag is not set?
        // Let's check which ones have spotify_track_url but we want to reassign them all.
        // Actually, we can pass an array of product IDs to fix, or just process X at a time.
        // Let's just fetch all products.
        const dbRes = await pool.query('SELECT id, name, description_he, top_notes, middle_notes, base_notes, spotify_track_url FROM products WHERE active = true');
        const products = dbRes.rows;

        // Find used track IDs
        let usedTrackIds = products.map(p => {
            if (p.spotify_track_url) {
                const parts = p.spotify_track_url.split('/');
                return parts[parts.length - 1];
            }
            return null;
        }).filter(Boolean);

        let unusedTracks = tracks.filter(t => !usedTrackIds.includes(t.id));

        // Just pick the first 5 that need fixing
        // To prevent infinite loop if they fail, let's pass a "start" param
        const start = parseInt(searchParams.get('start') || '0');
        const toFix = products.slice(start, start + parseInt(limit));

        let updatedCount = 0;
        let debugInfo = [];

        for (const p of toFix) {
            unusedTracks.sort(() => 0.5 - Math.random());
            const candidateTracks = unusedTracks.slice(0, 150);
            const candidatesList = candidateTracks.map(t => `- ID: ${t.id} | Artist: ${t.artist} | Title: ${t.name} | Genre: ${t.genre}`).join('\n');
            
            const prompt = `You are a master DJ matching perfumes to songs.
Perfume Name: ${p.name}
Description: ${p.description_he}
Notes: ${p.top_notes}, ${p.middle_notes}, ${p.base_notes}

Here is a list of 150 available Spotify tracks:
${candidatesList}

Pick the single track that BEST matches the vibe, mood, and style of this perfume (e.g. Tropical/Carnival -> Latin/Pop, Oud/Woody -> Dark R&B/Rock).
Return ONLY the EXACT Track ID from the list. Do not write anything else.`;

            try {
                const result = await model.generateContent(prompt);
                const rawText = result.response.text();
                const trackId = rawText.trim().replace(/[^a-zA-Z0-9]/g, ''); // Extract just alphanumeric just in case
                
                if (trackId && candidateTracks.find(t => t.id === trackId)) {
                    await pool.query('UPDATE products SET spotify_track_url = $1 WHERE id = $2', [`https://open.spotify.com/track/${trackId}`, p.id]);
                    unusedTracks = unusedTracks.filter(t => t.id !== trackId);
                    updatedCount++;
                } else {
                    debugInfo.push({ prod: p.name, rawText, trackId, candidates: candidateTracks.map(t=>t.id) });
                }
            } catch(e) {
                console.error("Gemini err:", e);
                debugInfo.push({ error: e.message });
            }
        }

        return NextResponse.json({ success: true, updatedCount, nextStart: start + parseInt(limit), total: products.length, debugInfo });

    } catch(e) {
        console.error("FATAL ERROR IN FIX:", e);
        return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
    }
}
