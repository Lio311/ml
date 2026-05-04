import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow more time for LLM generation

export async function GET(req) {
    // 1. Verify Vercel Cron Secret
    const authHeader = req.headers.get('authorization');
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        // Only return 401 if a secret is configured but doesn't match
        console.warn("Unauthorized cron attempt.");
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            console.error("Missing GEMINI_API_KEY");
            return NextResponse.json({ error: 'GEMINI_API_KEY is missing' }, { status: 500 });
        }

        const client = await pool.connect();
        let existingTitles = [];
        try {
            // Fetch recent articles to avoid duplication
            const res = await client.query('SELECT title, title_en FROM blog_posts ORDER BY created_at DESC LIMIT 50');
            existingTitles = res.rows.map(r => `"${r.title}" / "${r.title_en}"`);
        } finally {
            client.release();
        }

        // 2. Call Gemini
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-1.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
        You are an expert SEO content writer and researcher for an Israeli luxury niche perfume website called "ml-tlv". 
        The website sells perfume samples and decants (2ml, 5ml, 10ml) of highly sought-after niche brands (e.g., Tom Ford, Creed, Xerjoff, Parfums de Marly).
        
        Your task today is to autonomously find a NEW, trending, highly searched topic in the niche perfume world for 2026.
        It must be an interesting topic, such as "Top 5 Vanilla Perfumes for Winter 2026", "Is Baccarat Rouge still worth it?", or a spotlight on a specific trending brand.
        
        IMPORTANT: Do NOT write about any of these existing articles:
        ${existingTitles.join('\n')}

        Output EXACTLY a valid JSON object matching this schema:
        {
            "title": "Hebrew Title",
            "title_en": "English Title",
            "slug": "english-url-friendly-slug-no-spaces",
            "excerpt": "Hebrew short summary (max 2 sentences)",
            "excerpt_en": "English short summary (max 2 sentences)",
            "content": "Hebrew content in Markdown format. Use ## for headings, lists, and formatting. Make it engaging, informative, and persuasive.",
            "content_en": "English content in Markdown format.",
            "tags": ["HebrewTag1", "HebrewTag2"],
            "tags_en": ["EnglishTag1", "EnglishTag2"]
        }
        `;

        const result = await model.generateContent(prompt);
        let responseText = result.response.text();
        
        let generatedData;
        try {
            generatedData = JSON.parse(responseText);
        } catch (parseError) {
            console.error("Failed to parse Gemini response:", responseText);
            return NextResponse.json({ error: 'Failed to generate valid JSON content' }, { status: 500 });
        }

        const { title, title_en, slug, excerpt, excerpt_en, content, content_en, tags, tags_en } = generatedData;

        const formattedTags = Array.isArray(tags) ? tags : [];
        const formattedTagsEn = Array.isArray(tags_en) ? tags_en : [];

        // 3. Save to Database as Draft
        const dbClient = await pool.connect();
        try {
            // Check if slug already exists to prevent unique constraint error
            const slugCheck = await dbClient.query('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
            let finalSlug = slug;
            if (slugCheck.rows.length > 0) {
                finalSlug = `${slug}-${Date.now()}`;
            }

            await dbClient.query(
                `INSERT INTO blog_posts (title, title_en, slug, excerpt, excerpt_en, content, content_en, tags, tags_en, status, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'draft', NOW())`,
                [title, title_en, finalSlug, excerpt, excerpt_en, content, content_en, formattedTags, formattedTagsEn]
            );

            return NextResponse.json({ success: true, message: "Draft created successfully", title, slug: finalSlug });
        } finally {
            dbClient.release();
        }

    } catch (error) {
        console.error("Cron SEO Bot Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
