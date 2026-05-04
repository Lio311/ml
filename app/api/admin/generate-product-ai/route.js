import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
You are a niche perfume expert with deep knowledge of Fragrantica's perfume database.

For the perfume "${brand} ${name}", provide:
1. The fragrance note pyramid (top notes, middle/heart notes, base notes) — use English note names as they appear on Fragrantica.
2. A short, poetic product description in Hebrew for a luxury Israeli perfume decant shop called "ml-tlv".

IMPORTANT RULES:
- Use your knowledge of actual perfume compositions. If you truly don't know the exact notes of this perfume, provide your best educated guess based on the brand's style and the perfume name, but still fill in the notes.
- Notes should be in English, comma-separated.
- The description must be in Hebrew, 3-5 sentences max.
- Description style: Start with a short punchy atmosphere line (e.g. "קוקטייל בשקיעה.", "ממתק יוקרתי."). Weave in the key notes poetically. Describe who it's for or what feeling it projects. Use rich but accessible language.

Example descriptions for reference:
- "קוקטייל בשקיעה. מנגו ופסיפלורה עסיסיים בשיא הבשלות. בושם שפשוט מקרין שמחת חיים, צבעוניות וטרופיות מתפרצת."
- "כשעולם האופנה המינימליסטי פוגש את הבישום העילי. כמו ללבוש חולצה לבנה מכופתרת וחדשה לגמרי... יצירה שמשדרת סטייל, ניקיון ויוקרה מרוחקת."

Return EXACTLY this JSON structure:
{
  "top_notes": "Note1, Note2, Note3",
  "middle_notes": "Note1, Note2, Note3",
  "base_notes": "Note1, Note2, Note3",
  "description": "Hebrew description here"
}
`;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text().trim();

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
            description: data.description || ''
        });

    } catch (error) {
        console.error("AI Product Generation Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
