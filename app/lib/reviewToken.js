import crypto from 'crypto';

// Use an environment variable for the secret, fallback to a secure default if missing locally
const SECRET = process.env.CLERK_SECRET_KEY || process.env.DATABASE_URL || 'super_secret_review_key_99';

/**
 * Generates a signed review token containing the order ID and an expiration timestamp (7 days)
 * Format: base64(orderId:expiresAt):signature
 */
export function generateReviewToken(orderId) {
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days from now
    const payload = Buffer.from(`${orderId}:${expiresAt}`).toString('base64');
    
    const signature = crypto
        .createHmac('sha256', SECRET)
        .update(payload)
        .digest('hex');
        
    return `${payload}.${signature}`;
}

/**
 * Verifies a token and returns the parsed orderId if valid and not expired.
 * Returns null if invalid or expired.
 */
export function verifyReviewToken(token) {
    if (!token) return null;
    
    try {
        const parts = token.split('.');
        if (parts.length !== 2) return null;
        
        const [payload, signature] = parts;
        
        // Re-calculate signature
        const expectedSignature = crypto
            .createHmac('sha256', SECRET)
            .update(payload)
            .digest('hex');
            
        // Constant time comparison to prevent timing attacks
        const isValid = crypto.timingSafeEqual(
            Buffer.from(signature), 
            Buffer.from(expectedSignature)
        );
        
        if (!isValid) return null;
        
        // Parse payload
        const decoded = Buffer.from(payload, 'base64').toString('utf-8');
        const [orderIdStr, expiresAtStr] = decoded.split(':');
        
        const orderId = Number(orderIdStr) || orderIdStr;
        const expiresAt = parseInt(expiresAtStr, 10);
        
        // Check expiration
        if (Date.now() > expiresAt) {
            return null; // Expired
        }
        
        return orderId;
    } catch (e) {
        console.error("Failed to verify review token", e);
        return null;
    }
}
