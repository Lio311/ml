/**
 * Utility to validate required environment variables at runtime.
 */
export function validateEnv() {
    const requiredEnv = [
        'DATABASE_URL',
        'CLERK_SECRET_KEY',
        'NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY',
        'EMAIL_USER',
        'EMAIL_PASS',
        'NEXT_PUBLIC_CLERK_SIGN_IN_URL',
        'NEXT_PUBLIC_CLERK_SIGN_UP_URL',
    ];

    const missing = requiredEnv.filter(key => !process.env[key]);

    if (missing.length > 0) {
        const errorMsg = `Missing required environment variables: ${missing.join(', ')}`;
        console.error('❌ [Config Error]', errorMsg);
        
        // In local development, we want to see this clearly
        if (process.env.NODE_ENV === 'development') {
            // We don't throw here to avoid crashing the build if envs are handled by Vercel/CI
            // but we log it loudly.
        }
        
        return { success: false, missing };
    }

    return { success: true };
}
