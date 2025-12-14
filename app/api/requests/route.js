
import { NextResponse } from 'next/server';
import pool from '../../lib/db';
import { currentUser } from '@clerk/nextjs/server';

// Levenshtein Distance Helper
function levenshtein(a, b) {
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    const matrix = [];
    for (let i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1).toLowerCase() === a.charAt(j - 1).toLowerCase()) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1
                );
            }
        }
    }
    return matrix[b.length][a.length];
}

// Title Case Helper
function toTitleCase(str) {
    return str.replace(
        /\w\S*/g,
        text => text.charAt(0).toUpperCase() + text.substring(1).toLowerCase()
    );
}

export async function POST(req) {
    try {
        const user = await currentUser();
        const body = await req.json();
        let { brand, model } = body;

        if (!brand || !model) {
            return NextResponse.json({ error: 'Brand and Model are required' }, { status: 400 });
        }

        // Normalize Input
        brand = toTitleCase(brand.trim());
        model = toTitleCase(model.trim());
        const fullName = `${brand} ${model}`;
        const email = user?.emailAddresses[0]?.emailAddress || 'guest@unknown.com'; // Fallback if not logged in (though typically we should require it)

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Ensure Table Exists
            await client.query(`
                CREATE TABLE IF NOT EXISTS perfume_requests (
                    id SERIAL PRIMARY KEY,
                    user_email VARCHAR(255),
                    brand VARCHAR(255) NOT NULL,
                    model VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Fuzzy Matching
            // Fetch all distinct brand/model combinations to compare
            // Optimization: Maybe limit to recent ones or cache? For now, fetch distinct.
            const existingRes = await client.query('SELECT DISTINCT brand, model FROM perfume_requests');
            const existingPerfumes = existingRes.rows;

            let finalBrand = brand;
            let finalModel = model;
            let matchFound = false;

            for (const p of existingPerfumes) {
                const pName = `${p.brand} ${p.model}`;
                const dist = levenshtein(fullName, pName);
                if (dist <= 2) {
                    finalBrand = p.brand;
                    finalModel = p.model;
                    matchFound = true;
                    break;
                }
            }


            // Ensure Table Exists
            await client.query(`
                CREATE TABLE IF NOT EXISTS perfume_requests (
                    id SERIAL PRIMARY KEY,
                    user_email VARCHAR(255),
                    brand VARCHAR(255) NOT NULL,
                    model VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);

            // Validate English characters only
            if (!/^[a-zA-Z0-9\s\-]+$/.test(finalBrand) || !/^[a-zA-Z0-9\s\-]+$/.test(finalModel)) {
                await client.query('ROLLBACK');
                return NextResponse.json({ error: 'Only English characters allowed' }, { status: 400 });
            }

            // Check for existing request by same user
            const duplicateCheck = await client.query(
                `SELECT 1 FROM perfume_requests WHERE user_email = $1 AND brand = $2 AND model = $3`,
                [email, finalBrand, finalModel]
            );

            if (duplicateCheck.rowCount > 0) {
                await client.query('COMMIT');
                return NextResponse.json({ error: 'Duplicate request' }, { status: 409 });
            }

            // Fuzzy Matching (Wait, I should have done fuzzy matching BEFORE checking duplicate? 
            // The code I'm replacing has fuzzy matching logic *after* table create but *before* insert.
            // Oh, I am replacing a chunk that *includes* Fuzzy Matching?
            // No, my TargetContent below is just the INSERT part.
            // I need to be careful where I insert this check.
            // The Fuzzy Logic computes `finalBrand` and `finalModel`.
            // I should use `finalBrand` for the duplicate check.
            // The `finalBrand` is computed in the loop.
            // So I should insert the check *after* the loop and *before* the INSERT.

            // Re-reading file content...
            // Lines 78-87 is the loop.
            // Lines 90-93 is INSERT.
            // I will replace Lines 90-93 (Insert) with the Check + Insert.

            // Insert Request
            await client.query(
                `INSERT INTO perfume_requests (user_email, brand, model) VALUES ($1, $2, $3)`,
                [email, finalBrand, finalModel]
            );

            await client.query('COMMIT');
            return NextResponse.json({ success: true, brand: finalBrand, model: finalModel, matchFound });

        } catch (dbError) {
            await client.query('ROLLBACK');
            throw dbError;
        } finally {
            client.release();
        }

    } catch (error) {
        console.error('Request Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req) {
    try {
        const client = await pool.connect();
        try {
            // Check if table exists (graceful fail if not)
            const tableCheck = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'perfume_requests'
                );
            `);

            if (!tableCheck.rows[0].exists) {
                return NextResponse.json({ requests: [] });
            }

            // Aggregate requests for display
            // We want to show "Most Requested"
            const res = await client.query(`
                SELECT brand, model, COUNT(*) as count 
                FROM perfume_requests 
                GROUP BY brand, model 
                ORDER BY count DESC 
                LIMIT 50
            `);

            return NextResponse.json({ requests: res.rows });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error('Fetch Requests Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
