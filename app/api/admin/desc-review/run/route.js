import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import pool from "@/app/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

function hashDescription(desc) {
    return crypto.createHash('md5').update(desc || '').digest('hex');
}

async function callWithRetry(model, prompt, maxRetries = 3) {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
            const result = await model.generateContent(prompt);
            return result;
        } catch (error) {
            if (error.status === 429 && attempt < maxRetries - 1) {
                // Parse retry delay from error if available, or use exponential backoff
                const waitSeconds = Math.min(30 * (attempt + 1), 60);
                console.log(`Rate limited. Waiting ${waitSeconds}s before retry ${attempt + 2}/${maxRetries}...`);
                await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
            } else {
                throw error;
            }
        }
    }
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

        // Auto-migrate: ensure suggested_rewrite column exists
        const migrationClient = await pool.connect();
        try {
            await migrationClient.query(`ALTER TABLE product_desc_reviews ADD COLUMN IF NOT EXISTS suggested_rewrite TEXT`);
        } catch (e) {
            // Table might not exist at all
        } finally {
            migrationClient.release();
        }

        const client = await pool.connect();
        let toReview = [];
        try {
            const result = await client.query(`
                SELECT id, brand, model, description 
                FROM products 
                WHERE active = true 
                AND description IS NOT NULL 
                AND description != ''
            `);
            
            const existingReviews = await client.query(`SELECT product_id, description_hash FROM product_desc_reviews`);
            const reviewMap = new Set(existingReviews.rows.map(r => `${r.product_id}-${r.description_hash}`));

            for (const p of result.rows) {
                const hash = hashDescription(p.description);
                if (!reviewMap.has(`${p.id}-${hash}`)) {
                    toReview.push({ ...p, hash });
                }
                if (toReview.length >= 50) break;
            }
        } finally {
            client.release();
        }

        if (toReview.length === 0) {
            return NextResponse.json({ success: true, message: 'All descriptions already reviewed', reviewed: 0 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        // Batch size of 10 — uses fewer API calls (5 calls per 50 products instead of 10)
        const BATCH_SIZE = 10;
        let totalReviewed = 0;

        for (let i = 0; i < toReview.length; i += BATCH_SIZE) {
            const batch = toReview.slice(i, i + BATCH_SIZE);
            
            const batchPrompt = `
You are a senior copywriter reviewing product descriptions for a luxury Israeli niche perfume decant shop called "ml-tlv".

Review each of the following product descriptions. For each one, provide:
1. A rating from 1-10 (10 = perfect, engaging, poetic; 1 = terrible, generic, boring)
2. Brief strengths (what works well) - in Hebrew, max 1-2 sentences
3. Brief suggestions for improvement - in Hebrew, max 2-3 bullet points
4. A suggested_rewrite: The full improved description text in Hebrew, based on your suggestions.

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
    "strengths": "Hebrew text",
    "suggestions": "Hebrew text",
    "suggested_rewrite": "Full improved description in Hebrew"
  }
]
`;

            try {
                const result = await callWithRetry(model, batchPrompt);
                let responseText = result.response.text().trim();
                responseText = responseText.replace(/```json\s*/gi, '').replace(/```\s*/gi, '').trim();

                const reviews = JSON.parse(responseText);

                const saveClient = await pool.connect();
                try {
                    for (const review of reviews) {
                        const product = batch[review.index];
                        if (!product) continue;

                        await saveClient.query(`
                            INSERT INTO product_desc_reviews (product_id, brand, model, description, description_hash, rating, strengths, suggestions, suggested_rewrite, reviewed_at)
                            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                            ON CONFLICT (product_id, description_hash) DO UPDATE SET
                                rating = EXCLUDED.rating,
                                strengths = EXCLUDED.strengths,
                                suggestions = EXCLUDED.suggestions,
                                suggested_rewrite = EXCLUDED.suggested_rewrite,
                                reviewed_at = NOW()
                        `, [product.id, product.brand, product.model, product.description, product.hash, review.rating, review.strengths || '', review.suggestions || '', review.suggested_rewrite || '']);
                        
                        totalReviewed++;
                    }
                } finally {
                    saveClient.release();
                }
            } catch (batchError) {
                console.error(`Batch error at index ${i}:`, batchError.message || batchError);
                // If we hit a quota limit that retry couldn't solve, stop and return what we have
                if (batchError.status === 429) {
                    return NextResponse.json({ 
                        success: true, 
                        message: `Reviewed ${totalReviewed} descriptions. Quota limit reached — try again later.`,
                        reviewed: totalReviewed,
                        quotaLimited: true
                    });
                }
            }

            // 3 second delay between batches to stay under rate limits
            if (i + BATCH_SIZE < toReview.length) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: `Reviewed ${totalReviewed} descriptions`,
            reviewed: totalReviewed,
            remaining: toReview.length - totalReviewed
        });

    } catch (error) {
        console.error("Desc review run error:", error);
        return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
    }
}
