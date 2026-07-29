import { NextResponse } from "next/server";
import pool from "@/app/lib/db";
import { GoogleGenerativeAI } from "@google/generative-ai";
import crypto from "crypto";
import { logCronStart, logCronEnd } from "@/app/lib/errorLogger";

import { checkCronOrAdmin } from "@/app/lib/admin";
import { getBrandName } from "@/app/lib/brand";

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes

function hashDescription(desc) {
    return crypto.createHash('md5').update(desc || '').digest('hex');
}

export async function GET(req) {
    const startTime = Date.now();
    const logId = await logCronStart('desc-review');

    // Check for Vercel Cron header or Admin Session
    const isAuthorized = await checkCronOrAdmin(req);
    if (!isAuthorized) {
        if (logId) {
            await logCronEnd(logId, 'error', 'Unauthorized - invalid cron secret or not an admin', Date.now() - startTime);
        }
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
            if (logId) {
                await logCronEnd(logId, 'error', 'Missing API Key', Date.now() - startTime);
            }
            return NextResponse.json({ error: 'Missing API Key' }, { status: 500 });
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
                if (toReview.length >= 80) break; // 80 per cron run to be safe with 300s timeout
            }
        } finally {
            client.release();
        }

        if (toReview.length === 0) {
            if (logId) {
                await logCronEnd(logId, 'success', 'לא נמצאו תיאורים חדשים לסקירה', Date.now() - startTime);
            }
            return NextResponse.json({ success: true, message: 'Nothing to review' });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            generationConfig: { responseMimeType: "application/json" }
        });

        const brandName = await getBrandName();
        const BATCH_SIZE = 5;
        let totalReviewed = 0;

        for (let i = 0; i < toReview.length; i += BATCH_SIZE) {
            const batch = toReview.slice(i, i + BATCH_SIZE);
            
            const batchPrompt = `
You are a senior copywriter reviewing product descriptions for a luxury Israeli niche perfume decant shop called "${brandName}".
Review each of the following product descriptions. Provide rating (1-10), strengths, suggestions, and a suggested_rewrite.
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
    "strengths": "...",
    "suggestions": "...",
    "suggested_rewrite": "..."
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
            } catch (e) {
                console.error("Cron batch error:", e);
            }
            if (i + BATCH_SIZE < toReview.length) await new Promise(r => setTimeout(r, 1500));
        }

        if (logId) {
            await logCronEnd(logId, 'success', totalReviewed > 0 ? `נסקרו בהצלחה ${totalReviewed} תיאורי מוצרים` : 'לא נמצאו תיאורים חדשים לסקירה', Date.now() - startTime);
        }
        return NextResponse.json({ success: true, reviewed: totalReviewed });
    } catch (error) {
        console.error("Cron desc review error:", error);
        if (logId) {
            await logCronEnd(logId, 'error', error.message, Date.now() - startTime);
        }
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
