import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pool from '../../lib/db';

const tools = [
    {
        functionDeclarations: [
            {
                name: "search_catalog",
                description: "Search the perfume catalog for products matching the user's request. Always use this tool when the user asks for recommendations, specific notes (e.g. vanilla), seasons, or occasions.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        query: { type: "STRING", description: "General search term, e.g. 'Baccarat Rouge' or 'Vanilla'" },
                        season: { type: "STRING", description: "Season, e.g. 'summer', 'winter'" },
                        occasion: { type: "STRING", description: "Occasion, e.g. 'date', 'work', 'evening'" },
                        notes: { type: "STRING", description: "Specific notes, e.g. 'citrus', 'woody'" }
                    }
                }
            },
            {
                name: "add_to_cart",
                description: "Add a specific perfume size to the user's shopping cart. Call this when the user explicitly asks to add a perfume to their cart.",
                parameters: {
                    type: "OBJECT",
                    properties: {
                        productId: { type: "STRING", description: "The ID of the product to add" },
                        size: { type: "STRING", description: "The size to add, exactly '2ml', '5ml', or '10ml'" },
                        quantity: { type: "NUMBER", description: "The quantity of this size to add" }
                    },
                    required: ["productId", "size", "quantity"]
                }
            },
            {
                name: "go_to_checkout",
                description: "Redirect the user to the checkout page when they say they are ready to pay.",
                parameters: {
                    type: "OBJECT",
                    properties: {}
                }
            }
        ]
    }
];

const systemInstruction = `
You are the ML-TLV Smart Perfume Advisor. You are a highly professional, luxurious, yet friendly and helpful AI assistant for a niche perfume decants boutique in Israel.
Your main goals:
1. Help users find their perfect signature scent by asking clarifying questions if needed.
2. Recommend perfumes from the catalog using the 'search_catalog' tool.
3. Help users add items to their cart using the 'add_to_cart' tool.

Rules:
- ALWAYS converse in the language the user speaks (default to Hebrew).
- When recommending a perfume, use rich, evocative language.
- DO NOT invent perfumes that are not in the catalog. Always use 'search_catalog' to find real stock.
- If you use 'search_catalog' and get results, present them beautifully to the user.
- If you use a tool like 'add_to_cart', acknowledge it in your message (e.g. "I've added 5ml of Creed Aventus to your cart!").
- Keep responses relatively concise and highly readable.
`;

export async function POST(req) {
    try {
        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json({ error: 'Invalid messages array' }, { status: 400 });
        }

        const apiKey = process.env.GEMINI_API_KEY;
        if (!apiKey) {
             return NextResponse.json({ error: 'Gemini API key is not configured' }, { status: 500 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ 
            model: "gemini-2.5-flash",
            systemInstruction: systemInstruction,
            tools: tools
        });

        // Convert messages to Gemini format
        // Our client format: { role: 'user' | 'assistant' | 'tool', content: '...', tool_calls: [...], tool_call_id: '...' }
        const geminiHistory = [];
        
        for (const msg of messages) {
            if (msg.role === 'user') {
                geminiHistory.push({ role: 'user', parts: [{ text: msg.content }] });
            } else if (msg.role === 'assistant') {
                const parts = [];
                if (msg.content) {
                    parts.push({ text: msg.content });
                }
                if (msg.tool_calls) {
                    for (const tc of msg.tool_calls) {
                        parts.push({
                            functionCall: {
                                name: tc.name,
                                args: tc.args
                            }
                        });
                    }
                }
                geminiHistory.push({ role: 'model', parts });
            } else if (msg.role === 'tool') {
                geminiHistory.push({
                    role: 'user', // Gemini tool responses are sent as 'user' role with functionResponse
                    parts: [{
                        functionResponse: {
                            name: msg.tool_name,
                            response: { result: msg.content }
                        }
                    }]
                });
            }
        }

        // We use generateContent instead of startChat because we maintain history on the client
        // Added retry logic for 503 Service Unavailable (high demand)
        let response;
        let retries = 3;
        while (retries > 0) {
            try {
                response = await model.generateContent({ contents: geminiHistory });
                break;
            } catch (err) {
                if (err.message && err.message.includes('503') && retries > 1) {
                    retries--;
                    await new Promise(res => setTimeout(res, 1500)); // wait 1.5s before retry
                } else {
                    throw err;
                }
            }
        }

        const result = response.response;
        const functionCalls = result.functionCalls();
        const textContent = result.text() || "";

        // If the model decides to call a tool
        if (functionCalls && functionCalls.length > 0) {
            const toolCall = functionCalls[0];
            
            // Server-side tool execution
            if (toolCall.name === 'search_catalog') {
                const args = toolCall.args;
                
                // Execute DB search
                let dbResult = [];
                try {
                    let queryStr = `
                        SELECT id, brand, model, price_2ml, price_5ml, price_10ml, top_notes, seasons_en 
                        FROM products 
                        WHERE active = true
                    `;
                    const queryParams = [];
                    let paramCounter = 1;

                    if (args.query) {
                        queryStr += ` AND (brand ILIKE $${paramCounter} OR model ILIKE $${paramCounter} OR category ILIKE $${paramCounter})`;
                        queryParams.push(`%${args.query}%`);
                        paramCounter++;
                    }
                    if (args.season) {
                        queryStr += ` AND seasons_en ILIKE $${paramCounter}`;
                        queryParams.push(`%${args.season}%`);
                        paramCounter++;
                    }
                    if (args.notes) {
                        queryStr += ` AND (top_notes ILIKE $${paramCounter} OR middle_notes ILIKE $${paramCounter} OR base_notes ILIKE $${paramCounter})`;
                        queryParams.push(`%${args.notes}%`);
                        paramCounter++;
                    }

                    queryStr += ` LIMIT 5`;

                    const dbRes = await pool.query(queryStr, queryParams);
                    dbResult = dbRes.rows;
                } catch (dbErr) {
                    console.error("DB Search Error:", dbErr);
                    dbResult = { error: "Failed to search database" };
                }

                // Append the function call and the tool response, then generate again!
                const nextHistory = [...geminiHistory];
                nextHistory.push({
                    role: 'model',
                    parts: [{ functionCall: { name: toolCall.name, args: toolCall.args } }]
                });
                nextHistory.push({
                    role: 'user',
                    parts: [{
                        functionResponse: {
                            name: toolCall.name,
                            response: { result: dbResult }
                        }
                    }]
                });

                let followUpResponse;
                let followUpRetries = 3;
                while (followUpRetries > 0) {
                    try {
                        followUpResponse = await model.generateContent({ contents: nextHistory });
                        break;
                    } catch (err) {
                        if (err.message && err.message.includes('503') && followUpRetries > 1) {
                            followUpRetries--;
                            await new Promise(res => setTimeout(res, 1500));
                        } else {
                            throw err;
                        }
                    }
                }

                const followUpResult = followUpResponse.response;
                
                // Check if it wants to call ANOTHER tool
                const followUpFunctionCalls = followUpResult.functionCalls();
                if (followUpFunctionCalls && followUpFunctionCalls.length > 0) {
                    return NextResponse.json({
                        role: 'assistant',
                        content: followUpResult.text() || "",
                        tool_calls: followUpFunctionCalls.map(tc => ({ name: tc.name, args: tc.args }))
                    });
                }

                return NextResponse.json({
                    role: 'assistant',
                    content: followUpResult.text()
                });
            }

            // Client-side tools (add_to_cart, go_to_checkout)
            const enrichedToolCalls = [];
            for (const tc of functionCalls) {
                if (tc.name === 'add_to_cart') {
                    // Enrich with product data so frontend can use addToCart easily
                    try {
                        const prodRes = await pool.query('SELECT id, brand, model, price_2ml, price_5ml, price_10ml, image_url, stock FROM products WHERE id = $1', [tc.args.productId]);
                        if (prodRes.rows.length > 0) {
                            const product = prodRes.rows[0];
                            let price = 0;
                            if (tc.args.size === '2ml') price = product.price_2ml;
                            else if (tc.args.size === '5ml') price = product.price_5ml;
                            else if (tc.args.size === '10ml') price = product.price_10ml;
                            
                            enrichedToolCalls.push({
                                name: tc.name,
                                args: { ...tc.args, product, price }
                            });
                            continue;
                        }
                    } catch (e) { console.error(e); }
                }
                enrichedToolCalls.push({ name: tc.name, args: tc.args });
            }

            return NextResponse.json({
                role: 'assistant',
                content: textContent,
                tool_calls: enrichedToolCalls
            });
        }

        // Just text response
        return NextResponse.json({
            role: 'assistant',
            content: textContent
        });

    } catch (error) {
        console.error("Chat API Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error', stack: error.stack }, { status: 500 });
    }
}
