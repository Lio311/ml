import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// List of bots to block (Aggressive scrapers, not search engines)
const BAD_BOTS = [
    'ahrefsbot',
    'semrushbot',
    'mj12bot',
    'dotbot',
    'petalbot',
    'bytespider',
    'gptbot', // Open AI scraper
    'ccbot'
];

const isBadBot = (req) => {
    const ua = req.headers.get('user-agent')?.toLowerCase() || '';
    return BAD_BOTS.some(bot => ua.includes(bot));
};

export default clerkMiddleware(async (auth, req) => {
    if (isBadBot(req)) {
        return new NextResponse("Access Denied: Bot Detected", { status: 403 });
    }
});

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
};
