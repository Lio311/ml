"use client";

import { useState, useEffect } from 'react';

export default function HeroCarousel({ banners = [] }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);

    // Minimum swipe distance
    const minSwipeDistance = 50;

    // Auto-advance disabled per user request
    // useEffect(() => {
    //     if (!banners || banners.length <= 1) return;
    //     
    //     const timer = setInterval(() => {
    //         setCurrentIndex((prevIndex) => (prevIndex + 1) % banners.length);
    //     }, 6000); // 6 seconds per slide
    //
    //     return () => clearInterval(timer);
    // }, [banners]);

    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        
        if (isLeftSwipe || isRightSwipe) {
            if (isLeftSwipe) {
                // Swipe left (next)
                setCurrentIndex((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
            } else {
                // Swipe right (previous)
                setCurrentIndex((prev) => (prev === 0 ? banners.length - 1 : prev - 1));
            }
        }
    };

    if (!banners || banners.length === 0) return null;

    return (
        <div 
            className="relative w-full h-full overflow-hidden"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
        >
            {banners.map((banner, index) => (
                <div 
                    key={index} 
                    className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                        index === currentIndex ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                >
                    {banner.type === 'video' ? (
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            preload="auto"
                            fetchPriority={index === 0 ? "high" : "auto"}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: banner.objectPosition || 'center' }}
                        >
                            <source src={banner.url || "/hero-video.mp4"} type="video/mp4" />
                        </video>
                    ) : (
                        <img
                            src={banner.url || "/hero-video.mp4"}
                            alt={`Banner ${index + 1}`}
                            className="w-full h-full object-cover"
                            style={{ objectPosition: banner.objectPosition || 'center' }}
                            fetchPriority={index === 0 ? "high" : "auto"}
                        />
                    )}
                </div>
            ))}

            {/* Dots navigation */}
            {banners.length > 1 && (
                <div className="absolute bottom-5 md:bottom-3 left-0 right-0 z-20 flex justify-center gap-3">
                    {banners.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentIndex(index)}
                            aria-label={`Go to slide ${index + 1}`}
                            className={`w-3 h-3 md:w-3.5 md:h-3.5 rounded-full transition-all duration-300 shadow-md border border-white/50 ${
                                index === currentIndex 
                                    ? 'bg-white scale-125' 
                                    : 'bg-white/40 hover:bg-white/70'
                            }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
