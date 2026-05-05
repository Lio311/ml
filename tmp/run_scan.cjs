require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const crypto = require("crypto");

const pool = new Pool({ connectionString: process.env.DATABASE_URL || process.env.POSTGRES_URL });

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
                const waitSeconds = Math.min(30 * (attempt + 1), 60);
                console.log(`Rate limited. Waiting ${waitSeconds}s before retry ${attempt + 2}/${maxRetries}...`);
                await new Promise(resolve => setTimeout(resolve, waitSeconds * 1000));
            } else {
                throw error;
            }
        }
    }
}

async function runScan() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        console.error("No API key");
        return;
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
        }
    } catch (e) {
        console.error(e);
    } finally {
        client.release();
    }

    console.log(`Found ${toReview.length} products to review.`);
    if (toReview.length === 0) {
        pool.end();
        return;
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ 
        model: "gemini-2.5-flash",
        generationConfig: { responseMimeType: "application/json" }
    });

    const BATCH_SIZE = 10;
    let totalReviewed = 0;

    for (let i = 0; i < toReview.length; i += BATCH_SIZE) {
        const batch = toReview.slice(i, i + BATCH_SIZE);
        console.log(`Processing batch ${i / BATCH_SIZE + 1} of ${Math.ceil(toReview.length / BATCH_SIZE)}...`);
        
        const batchPrompt = `
You are an expert copywriter for a luxury perfume boutique. 
Analyze these product descriptions and rate them out of 10.
Return a JSON array of objects, one for each product, exactly matching this structure:
[
  {
    "id": 123,
    "score": 8,
    "issues": "Lacks emotion, too technical",
    "suggested_rewrite": "A full, beautiful rewrite of the description in Hebrew..."
  }
]

Products:
${JSON.stringify(batch.map(p => ({ id: p.id, brand: p.brand, model: p.model, description: p.description })), null, 2)}
        `;

        try {
            const result = await callWithRetry(model, batchPrompt);
            const text = result.response.text();
            const jsonArray = JSON.parse(text);

            const saveClient = await pool.connect();
            try {
                await saveClient.query('BEGIN');
                for (const review of jsonArray) {
                    const product = batch.find(p => p.id === review.id);
                    if (!product) continue;

                    await saveClient.query(`
                        INSERT INTO product_desc_reviews 
                        (product_id, description_hash, score, issues, suggested_rewrite) 
                        VALUES ($1, $2, $3, $4, $5)
                        ON CONFLICT (product_id) 
                        DO UPDATE SET 
                            description_hash = EXCLUDED.description_hash,
                            score = EXCLUDED.score,
                            issues = EXCLUDED.issues,
                            suggested_rewrite = EXCLUDED.suggested_rewrite,
                            reviewed_at = NOW()
                    `, [review.id, product.hash, review.score, review.issues, review.suggested_rewrite]);
                }
                await saveClient.query('COMMIT');
                totalReviewed += jsonArray.length;
                console.log(`Saved batch ${i / BATCH_SIZE + 1}. Total reviewed: ${totalReviewed}`);
            } catch (err) {
                await saveClient.query('ROLLBACK');
                console.error(`Database error saving batch:`, err);
            } finally {
                saveClient.release();
            }
            
            // Sleep slightly between batches to avoid immediate rate limit
            await new Promise(r => setTimeout(r, 2000));

        } catch (error) {
            console.error(`Error in batch ${i / BATCH_SIZE + 1}:`, error.message);
            if (error.message.includes('429')) {
                console.log("Quota exceeded. Stopping script.");
                break;
            }
        }
    }

    console.log(`Finished processing. Total successfully reviewed this run: ${totalReviewed}`);
    pool.end();
}

runScan();
