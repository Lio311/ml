import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from 'fs';
import path from 'path';
import { getBrandName } from '@/app/lib/brand';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req) {
    try {
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses?.[0]?.emailAddress;
        const isSuperAdmin = email === process.env.ADMIN_EMAIL;

        if (!isSuperAdmin && role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { brand, name } = await req.json();

        if (!brand || !name) {
            return NextResponse.json({ error: 'Brand and Name are required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is missing' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            tools: [{ googleSearch: {} }],
        });

        // Pick 150 random tracks to provide as candidates
        let candidatesList = '';
        try {
            const tracksPath = path.join(process.cwd(), 'app', 'lib', 'spotify_tracks.json');
            const tracks = JSON.parse(fs.readFileSync(tracksPath, 'utf8'));
            tracks.sort(() => 0.5 - Math.random());
            const candidateTracks = tracks.slice(0, 150);
            candidatesList = candidateTracks.map(t => `- ID: ${t.id} | Artist: ${t.artist} | Title: ${t.name} | Genre: ${t.genre}`).join('\n');
        } catch(e) {}

        const brandName = await getBrandName();

        const searchPrompt = `Search Fragrantica for the perfume "${brand} ${name}" and find its EXACT fragrance note pyramid (top notes, middle/heart notes, base notes). 
Use only notes that actually appear on the Fragrantica page for this specific perfume. Do NOT guess or make up notes.

After finding the real notes, write a short poetic product description in Hebrew for a luxury Israeli perfume decant shop called "${brandName}".

Description rules:
- 3-5 sentences max, Hebrew only
- Start with a short punchy atmosphere line (e.g. "קוקטייל בשקיעה.", "ממתק יוקרתי.")
- Weave the real notes poetically, don't just list them
- Example descriptions:
- "קוקטייל בשקיעה. מנגו ופסיפלורה עסיסיים בשיא הבשלות. בושם שפשוט מקרין שמחת חיים, צבעוניות וטרופיות מתפרצת."

Finally, pick the single track that BEST matches the vibe, mood, and style of this perfume from the following list of 150 available Spotify tracks:
${candidatesList}

Return your answer as a valid JSON object with this EXACT structure (no markdown, no backticks, just raw JSON):
{
  "top_notes": "Note1, Note2, Note3",
  "middle_notes": "Note1, Note2, Note3",
  "base_notes": "Note1, Note2, Note3",
  "description": "Hebrew description here",
  "spotify_track_id": "The EXACT Track ID you chose from the list"
}`;

        const result = await model.generateContent(searchPrompt);
        let responseText = result.response.text().trim();

        // Strip markdown code fences if present
        responseText = responseText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", responseText);
            return NextResponse.json({ error: 'AI returned invalid format. Please try again.' }, { status: 500 });
        }

        // Clean up description quotes
        if (data.description) {
            data.description = data.description.replace(/^["'״`]+|["'״`]+$/g, '');
        }

        let spotify_track_url = '';
        if (data.spotify_track_id) {
             spotify_track_url = `https://open.spotify.com/track/${data.spotify_track_id}`;
        }

        return NextResponse.json({ 
            success: true, 
            top_notes: data.top_notes || '',
            middle_notes: data.middle_notes || '',
            base_notes: data.base_notes || '',
            description: data.description || '',
            spotify_track_url: spotify_track_url
        });

    } catch (error) {
        console.error("AI Product Generation Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
