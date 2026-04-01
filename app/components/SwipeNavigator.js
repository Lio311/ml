"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '../context/LanguageContext';

export default function SwipeNavigator() {
    const router = useRouter();
    const { dir } = useLanguage();

    useEffect(() => {
        let touchStartX = 0;
        let touchEndX = 0;
        let touchStartY = 0;
        let touchEndY = 0;

        const handleTouchStart = (e) => {
            if (e.touches.length > 1) return;
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        };

        const handleTouchEnd = (e) => {
            if (e.changedTouches.length > 1) return;
            touchEndX = e.changedTouches[0].clientX;
            touchEndY = e.changedTouches[0].clientY;

            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // Check if it's primarily a horizontal swipe
            if (Math.abs(deltaX) > Math.abs(deltaY) * 2) {
                // Ignore swipes if target is within a horizontally scrollable element
                // e.g., product carousels
                let el = e.target;
                let isScrollable = false;
                while (el && el !== document.body) {
                    const style = window.getComputedStyle(el);
                    if (style.overflowX === 'auto' || style.overflowX === 'scroll' || style.touchAction === 'pan-x') {
                        isScrollable = true;
                        break;
                    }
                    el = el.parentElement;
                }
                
                if (isScrollable) return;

                const SWIPE_THRESHOLD = 80;

                // Restrict swipe gesture start to near screen edges to avoid accidental triggers
                const EDGE_SIZE = 40;
                const windowWidth = window.innerWidth;
                const isEdgeSwipe = touchStartX <= EDGE_SIZE || touchStartX >= windowWidth - EDGE_SIZE;
                
                if (!isEdgeSwipe) return;

                // For RTL (Hebrew/Arabic), pulling from right edge to left goes BACK.
                // For LTR (English), pulling from left edge to right goes BACK.
                if (dir === 'rtl') {
                    if (deltaX < -SWIPE_THRESHOLD) {
                        router.back();
                    } else if (deltaX > SWIPE_THRESHOLD) {
                        router.forward();
                    }
                } else {
                    if (deltaX > SWIPE_THRESHOLD) {
                        router.back();
                    } else if (deltaX < -SWIPE_THRESHOLD) {
                        router.forward();
                    }
                }
            }
        };

        document.addEventListener('touchstart', handleTouchStart, { passive: true });
        document.addEventListener('touchend', handleTouchEnd, { passive: true });

        return () => {
            document.removeEventListener('touchstart', handleTouchStart);
            document.removeEventListener('touchend', handleTouchEnd);
        };
    }, [router, dir]);

    return null; // Component does not render anything directly
}
