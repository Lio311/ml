/**
 * Simple in-memory rate limiter using the Token Bucket algorithm.
 * Note: In serverless environments like Vercel, this is best-effort 
 * as memory is not shared across all instances. For production-grade 
 * limiting, a Redis-based solution (e.g., Upstash) is recommended.
 */
const cache = new Map();

export function rateLimit(ip, limit = 10, windowMs = 60000) {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // Get requests for this IP
    let requests = cache.get(ip) || [];
    
    // Filter out old requests
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    if (requests.length >= limit) {
        return {
            success: false,
            limit,
            remaining: 0,
            reset: requests[0] + windowMs
        };
    }
    
    // Add new request
    requests.push(now);
    cache.set(ip, requests);
    
    return {
        success: true,
        limit,
        remaining: limit - requests.length,
        reset: now + windowMs
    };
}

// Cleanup old entries every 5 minutes to prevent memory leaks
if (typeof setInterval !== 'undefined') {
    setInterval(() => {
        const now = Date.now();
        for (const [ip, requests] of cache.entries()) {
            const validRequests = requests.filter(ts => ts > now - 300000);
            if (validRequests.length === 0) {
                cache.delete(ip);
            } else {
                cache.set(ip, validRequests);
            }
        }
    }, 300000);
}
