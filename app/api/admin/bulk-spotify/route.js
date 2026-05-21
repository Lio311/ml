import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import pool from "../../../lib/db";
import { currentUser } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function GET(req) {
    // Only allow admin
    const user = await currentUser();
    const role = user?.publicMetadata?.role;
    const email = user?.emailAddresses?.[0]?.emailAddress;
    const isSuperAdmin = email === process.env.ADMIN_EMAIL;

    if (!isSuperAdmin && role !== 'admin') {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        const client = await pool.connect();
        try {
            // Find 1 product without spotify_track_url to avoid Vercel 10s timeout
            const res = await client.query(`
                SELECT id, name, description_en, top_notes_en, middle_notes_en, base_notes_en 
                FROM products 
                WHERE spotify_track_url IS NULL 
                ORDER BY id DESC 
                LIMIT 1
            `);
            
            const products = res.rows;
            if (products.length === 0) {
                return new NextResponse(
                    `<html><body><h1>Done! All products processed.</h1></body></html>`,
                    { headers: { "Content-Type": "text/html" } }
                );
            }

            const apiKey = process.env.GEMINI_API_KEY;
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

            const updated = [];

            for (const p of products) {
                const prompt = `You are a music and perfume expert. I have a luxury niche perfume. 
Perfume Name: ${p.name}
Description: ${p.description_en}
Top Notes: ${p.top_notes_en}
Middle Notes: ${p.middle_notes_en}
Base Notes: ${p.base_notes_en}

Find ONE specific real Spotify track that perfectly matches the vibe, mood, and notes of this perfume.
Return ONLY the raw Spotify track URL (e.g. https://open.spotify.com/track/4cOdK2wGLETKBW3PvgPWqT). No other text, no markdown.`;

                try {
                    const result = await model.generateContent(prompt);
                    const text = result.response.text().trim();
                    const urlMatch = text.match(/https:\/\/open\.spotify\.com\/track\/[a-zA-Z0-9]+/);
                    
                    if (urlMatch) {
                        const trackUrl = urlMatch[0];
                        await client.query('UPDATE products SET spotify_track_url = $1 WHERE id = $2', [trackUrl, p.id]);
                        updated.push({ id: p.id, name: p.name, trackUrl });
                    } else {
                         await client.query('UPDATE products SET spotify_track_url = $1 WHERE id = $2', ['N/A', p.id]);
                         updated.push({ id: p.id, name: p.name, trackUrl: 'N/A' });
                    }
                } catch (e) {
                    console.error("AI Error:", e);
                }
            }

            const remaining = await client.query('SELECT COUNT(*) FROM products WHERE spotify_track_url IS NULL');
            const remainingCount = remaining.rows[0].count;

            const html = `
            <html>
                <head>
                    <meta http-equiv="refresh" content="2">
                    <style>body { font-family: sans-serif; padding: 20px; }</style>
                </head>
                <body>
                    <h2>Bulk Spotify AI Processor</h2>
                    <p>Processed this batch: ${updated.map(u => u.name).join(', ')}</p>
                    <h3>Remaining products to process: ${remainingCount}</h3>
                    <p>This page will automatically refresh every 2 seconds until done. Do not close.</p>
                </body>
            </html>
            `;

            return new NextResponse(html, { headers: { "Content-Type": "text/html" } });

        } finally {
            client.release();
        }
    } catch (error) {
        console.error(error);
        return new NextResponse(`Error: ${error.message}`, { status: 500 });
    }
}
