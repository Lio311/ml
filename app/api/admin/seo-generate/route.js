import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPremiumBlogImage } from "@/app/lib/blogImageMatcher";

export const dynamic = 'force-dynamic';
export const maxDuration = 60; // Allow more time for LLM generation

export async function POST(req) {
    try {
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses?.[0]?.emailAddress;
        const isSuperAdmin = email === process.env.ADMIN_EMAIL;

        if (!isSuperAdmin && role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { topic, keywords } = await req.json();

        if (!topic) {
            return NextResponse.json({ error: 'Topic is required' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is missing from environment variables' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const prompt = `
        You are an expert SEO content writer for an Israeli luxury niche perfume website called "ml-tlv". 
        The website sells perfume samples and decants (2ml, 5ml, 10ml) of highly sought-after niche brands.
        
        Write an engaging, SEO-optimized blog post about the following topic: "${topic}".
        ${keywords ? `Please try to naturally include these keywords: ${keywords}` : ""}

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

        // Ensure tags are formatted for Postgres arrays if necessary, or let node-pg handle it via parameter
        // The DB schema expects string[] for tags and tags_en.
        // E.g., ['tag1', 'tag2']
        const formattedTags = Array.isArray(tags) ? tags : [];
        const formattedTagsEn = Array.isArray(tags_en) ? tags_en : [];

        // Determine a gorgeous premium matching cover image
        const imageUrl = getPremiumBlogImage(title, content, formattedTags);

        // Save to Database
        const client = await pool.connect();
        try {
            // Check if slug already exists to prevent unique constraint error
            const slugCheck = await client.query('SELECT id FROM blog_posts WHERE slug = $1', [slug]);
            let finalSlug = slug;
            if (slugCheck.rows.length > 0) {
                finalSlug = `${slug}-${Date.now()}`;
            }

            await client.query(
                `INSERT INTO blog_posts (title, title_en, slug, excerpt, excerpt_en, content, content_en, tags, tags_en, image_url, status, created_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft', NOW())`,
                [title, title_en, finalSlug, excerpt, excerpt_en, content, content_en, formattedTags, formattedTagsEn, imageUrl]
            );

            return NextResponse.json({ success: true, title, title_en, slug: finalSlug });
        } finally {
            client.release();
        }

    } catch (error) {
        console.error("SEO Generation Error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
