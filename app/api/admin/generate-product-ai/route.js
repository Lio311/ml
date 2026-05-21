import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

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
        
        // Use Google Search grounding so Gemini actually looks up the perfume on Fragrantica
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            tools: [{ googleSearch: {} }],
        });

        const searchPrompt = `Search Fragrantica for the perfume "${brand} ${name}" and find its EXACT fragrance note pyramid (top notes, middle/heart notes, base notes). 
Use only notes that actually appear on the Fragrantica page for this specific perfume. Do NOT guess or make up notes.

After finding the real notes, write a short poetic product description in Hebrew for a luxury Israeli perfume decant shop called "ml-tlv".

Description rules:
- 3-5 sentences max, Hebrew only
- Start with a short punchy atmosphere line (e.g. "קוקטייל בשקיעה.", "ממתק יוקרתי.")
- Weave the real notes poetically, don't just list them
- Example descriptions:
- "קוקטייל בשקיעה. מנגו ופסיפלורה עסיסיים בשיא הבשלות. בושם שפשוט מקרין שמחת חיים, צבעוניות וטרופיות מתפרצת."
- "לא הקולון של סבא שלך. זהו קולון שעבר דרך האש... מתאים לחובבי בישום שמחפשים את הטוויסט המורכב והמעושן."

Finally, pick the best matching Spotify track URL from this EXACT list (do NOT invent URLs):
1. Tropical/Mango/Fruity: https://open.spotify.com/track/6UelLqGlWMcVH1E5c4H7lY (Watermelon Sugar)
2. Fresh/Citrus/Summer: https://open.spotify.com/track/1BxfuPKylH5zH226gZ5yJj (Cruel Summer)
3. Seductive/Night: https://open.spotify.com/track/25S6vE8VPZpP3bWlUaYlqP (Earned It)
4. Clean/Aquatic: https://open.spotify.com/track/6S3JlQUWk1Ifb3O12Y8s61 (Ocean Eyes)
5. Chill/Relaxing: https://open.spotify.com/track/0hN1YJv0sS3a6Xp68q8x8G (Sunset Lover)
6. Energetic/Party: https://open.spotify.com/track/0VjIj9nkp3N9v2b5WvF9qV (Blinding Lights)
7. Sweet/Vanilla/Gourmand: https://open.spotify.com/track/4iJyoBOLtHqaGxP12qzhQI (Peaches)
8. Woody/Smoky/Leather: https://open.spotify.com/track/5FVd6KXrgO9B3JPWvzMopS (Do I Wanna Know)
9. Winter/Spicy/Cozy: https://open.spotify.com/track/2QjOHNKaiLHeH60jR2vR8e (Sweater Weather)
10. Pop/Floral/Sweet: https://open.spotify.com/track/39n1bC4c14J1dYw40r2Lp8 (Levitating)

Return your answer as a valid JSON object with this EXACT structure (no markdown, no backticks, just raw JSON):
{
  "top_notes": "Note1, Note2, Note3",
  "middle_notes": "Note1, Note2, Note3",
  "base_notes": "Note1, Note2, Note3",
  "description": "Hebrew description here",
  "spotify_track_url": "URL chosen from the list above"
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

        return NextResponse.json({ 
            success: true, 
            top_notes: data.top_notes || '',
            middle_notes: data.middle_notes || '',
            base_notes: data.base_notes || '',
            description: data.description || '',
            spotify_track_url: (() => { try { const t = JSON.parse(fs.readFileSync(path.join(process.cwd(), "app/lib/spotify_tracks.json"))); return "https://open.spotify.com/track/" + t[Math.floor(Math.random()*t.length)]; } catch(e) { return ""; } })()
        });

    } catch (error) {
        console.error("AI Product Generation Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
