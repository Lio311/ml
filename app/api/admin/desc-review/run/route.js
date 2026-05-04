import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import pool from "@/app/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes for batch processing

function hashDescription(desc) {
    return crypto.createHash('md5').update(desc || '').digest('hex');
}

export async function POST() {
    try {
        const user = await currentUser();
        const role = user?.publicMetadata?.role;
        const email = user?.emailAddresses?.[0]?.emailAddress;
        const isSuperAdmin = email === process.env.ADMIN_EMAIL;

        if (!isSuperAdmin && role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json({ error: 'GEMINI_API_KEY is missing' }, { status: 500 });
        }

        const client = await pool.connect();
        let products;
        try {
            // Get all active products with descriptions
            const result = await client.query(`
                SELECT id, brand, model, description 
                FROM products 
                WHERE active = true 
                AND description IS NOT NULL 
                AND description != ''
                ORDER BY id
            `);
            products = result.rows;
        } finally {
            client.release();
        }

        if (!products || products.length === 0) {
            return NextResponse.json({ success: true, message: 'No products with descriptions found', reviewed: 0 });
        }

        // Filter out products that already have a review for the current description
        const dbClient = await pool.connect();
        let toReview = [];
        try {
            for (const product of products) {
                const hash = hashDescription(product.description);
                const existing = await dbClient.query(
                    'SELECT id FROM product_desc_reviews WHERE product_id = $1 AND description_hash = $2',
                    [product.id, hash]
                );
                if (existing.rows.length === 0) {
                    toReview.push({ ...product, hash });
                }
            }
        } finally {
            dbClient.release();
        }

        if (toReview.length === 0) {
            return NextResponse.json({ success: true, message: 'All descriptions already reviewed', reviewed: 0 });
        }

        // Process in batches of 5 to avoid rate limits
        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const BATCH_SIZE = 5;
        let totalReviewed = 0;

        for (let i = 0; i < toReview.length; i += BATCH_SIZE) {
            const batch = toReview.slice(i, i + BATCH_SIZE);
            
            const batchPrompt = `
You are a senior copywriter reviewing product descriptions for a luxury Israeli niche perfume decant shop called "ml-tlv".

Review each of the following product descriptions. For each one, provide:
1. A rating from 1-10 (10 = perfect, engaging, poetic; 1 = terrible, generic, boring)
2. Brief strengths (what works well) - in Hebrew, max 1-2 sentences
3. Brief suggestions for improvement - in Hebrew, max 2-3 bullet points

Rating guide:
- 9-10: Exceptional. Poetic, evocative, matches brand voice perfectly. Uses sensory language.
- 7-8: Good. Clear and engaging, but could be more poetic or specific.
- 5-6: Average. Gets the job done but feels generic. Could use more personality.
- 3-4: Below average. Too short, too vague, or doesn't match the luxury brand voice.
- 1-2: Poor. Missing, placeholder, or completely off-brand.

Products to review:
${batch.map((p, idx) => `
[Product ${idx + 1}]
Brand: ${p.brand}
Model: ${p.model}
Description: "${p.description}"
`).join('\n')}

Return a JSON array with exactly ${batch.length} objects:
[
  {
    "index": 0,
    "rating": 8,
    "strengths": "Hebrew text about what's good",
    "suggestions": "Hebrew text with improvement ideas"
  }
]
`;

            try {
                const result = await model.generateContent(batchPrompt);
                let responseText = result.response.text().trim();
                responseText = responseText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

                const reviews = JSON.parse(responseText);

                const saveClient = await pool.connect();
                try {
                    for (const review of reviews) {
                        const product = batch[review.index];
                        if (!product) continue;

                        await saveClient.query(`
                            INSERT INTO product_desc_reviews (product_id, brand, model, description, description_hash, rating, strengths, suggestions, reviewed_at)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
                            ON CONFLICT (product_id, description_hash) DO UPDATE SET
                                rating = EXCLUDED.rating,
                                strengths = EXCLUDED.strengths,
                                suggestions = EXCLUDED.suggestions,
                                reviewed_at = NOW()
                        `, [product.id, product.brand, product.model, product.description, product.hash, review.rating, review.strengths || '', review.suggestions || '']);
                        
                        totalReviewed++;
                    }
                } finally {
                    saveClient.release();
                }
            } catch (batchError) {
                console.error(`Batch error at index ${i}:`, batchError);
                // Continue with next batch even if one fails
            }

            // Small delay between batches to avoid rate limits
            if (i + BATCH_SIZE < toReview.length) {
                await new Promise(resolve => setTimeout(resolve, 1500));
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Reviewed ${totalReviewed} out of ${toReview.length} descriptions`,
            reviewed: totalReviewed,
            total: toReview.length
        });

    } catch (error) {
        console.error("Desc review run error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
