'use client';

import { useEffect } from 'react';

export default function BackgroundCronTrigger() {
    useEffect(() => {
        // Run once on mount in the client
        try {
            const lastRun = localStorage.getItem('last_delayed_email_check');
            const now = Date.now();
            
            // Trigger background job at most once every 60 seconds per active user session
            if (!lastRun || now - parseInt(lastRun) > 60000) {
                localStorage.setItem('last_delayed_email_check', now.toString());
                
                // Fire and forget - silently process any delayed emails queue
                fetch('/api/cron/process-delayed-emails').catch(() => {});
            }
        } catch (e) {
            // Ignore localStorage errors (e.g., in incognito or restricted browsers)
        }
    }, []);

    return null;
}
