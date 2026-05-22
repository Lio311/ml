"use client";

import { useEffect, useRef, useState } from 'react';

export default function FadeIn({ children, delay = 0, direction = "up", className = "", distance = 40, duration = 0.8 }) {
    const ref = useRef(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        // root: null = actual window viewport, ignores overflow-x-hidden parents
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { root: null, threshold: 0.01, rootMargin: "0px 0px -50px 0px" }
        );

        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    const getInitialTransform = () => {
        if (direction === "up") return `translateY(${distance}px)`;
        if (direction === "down") return `translateY(-${distance}px)`;
        if (direction === "left") return `translateX(${distance}px)`;
        if (direction === "right") return `translateX(-${distance}px)`;
        return "none";
    };

    return (
        <div
            ref={ref}
            className={className}
            style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translate(0,0)" : getInitialTransform(),
                transition: `opacity ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}s, transform ${duration}s cubic-bezier(0.16,1,0.3,1) ${delay}s`,
            }}
        >
            {children}
        </div>
    );
}
