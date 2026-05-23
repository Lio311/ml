"use client";

import Image from "next/image";
import { useState } from "react";

/**
 * Smart Image Component (CImage)
 * 
 * This component acts as a wrapper for Next.js Image.
 * It automatically falls back to unoptimized loading if the platform's image optimization
 * service returns an error (like the 402 Payment Required when quota is reached).
 */
export default function CImage({ unoptimized, onError, ...props }) {
    const [fallback, setFallback] = useState(false);
    
    // Check for global override via environment variable
    const globalUnoptimized = process.env.NEXT_PUBLIC_DISABLE_IMAGE_OPTIMIZATION === 'true';

    return (
        <Image
            alt={props.alt || ""}
            {...props}
            unoptimized={unoptimized || fallback || globalUnoptimized}
            onError={(e) => {
                // If we haven't already fallen back, and it's not explicitly unoptimized
                if (!fallback && !unoptimized && !globalUnoptimized) {
                    setFallback(true);
                }
                // Call the original onError if provided
                if (onError) onError(e);
            }}
        />
    );
}
