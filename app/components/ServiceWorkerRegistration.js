"use client";
import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
    useEffect(() => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    // Check for updates periodically (every 60 minutes)
                    setInterval(() => {
                        registration.update();
                    }, 60 * 60 * 1000);
                })
                .catch((err) => {
                    console.error('SW registration failed:', err);
                });
        }
    }, []);

    return null;
}
