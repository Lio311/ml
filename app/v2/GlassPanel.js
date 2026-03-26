"use client";

export default function GlassPanel({ children, className = "", dark = false, parallax = "" }) {
    const parallaxClass = parallax === 'fast' ? 'parallax-fast' : (parallax === 'slow' ? 'parallax-slow' : '');
    const glassClass = dark ? 'glass-dark' : 'glass';
    
    return (
        <div className={`floating-layer ${parallaxClass} ${glassClass} ${className}`}>
            {children}
        </div>
    );
}
