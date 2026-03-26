"use client";

import { useEffect, useState } from 'react';
import './v2.css';

export default function V2ClientLayout({ children }) {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            setScrollY(window.scrollY);
            document.documentElement.style.setProperty('--scroll-y', `${window.scrollY}px`);
        };

        window.addEventListener('scroll', handleScroll, { passive: true });
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <div className="v2-root min-h-screen relative overflow-x-hidden glass-container selection:bg-white/30">
            {/* HD Monochrome Background Video */}
            <div className="fixed inset-0 w-full h-full -z-20 overflow-hidden bg-black">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-40 grayscale contrast-125 scale-105"
                >
                    <source src="/hero-video.mp4" type="video/mp4" />
                </video>
                {/* Visual Grain/Texture Overlay */}
                <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.03] pointer-events-none"></div>
                <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/40"></div>
            </div>

            <div className="relative z-10 antialiased">
                {children}
            </div>
            
            <style jsx global>{`
                body {
                    background: black;
                    color: white;
                }
                * {
                    scrollbar-width: thin;
                    scrollbar-color: rgba(255,255,255,0.2) transparent;
                }
            `}</style>
        </div>
    );
}
