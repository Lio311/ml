// Simple In-Memory Rate Limiter for Serverless (Best effort per instance)
// Not 100% accurate in a distributed Vercel environment, but good enough for basic spam.

const rateLimitMap = new Map();

export function checkRateLimit(ip, limit = 20, windowMs = 60000) {
    const now = Date.now();
    
    if (!rateLimitMap.has(ip)) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return true;
    }

    const record = rateLimitMap.get(ip);
    
    if (now > record.resetTime) {
        // Window expired, reset
        rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
        return true;
    }

    if (record.count >= limit) {
        return false; // Rate limit exceeded
    }

    // Increment count
    record.count += 1;
    rateLimitMap.set(ip, record);
    
    // Clean up memory occasionally (prevents memory leaks)
    if (Math.random() < 0.05) {
        for (const [key, val] of rateLimitMap.entries()) {
            if (now > val.resetTime) rateLimitMap.delete(key);
        }
    }

    return true;
}
