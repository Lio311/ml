"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function AnalyticsTracker() {
    const pathname = usePathname();

    useEffect(() => {
        // Check if we already counted this session (Simple "Session Visit" logic)
        // If 'visited_session' exists in sessionStorage, we skip.
        // This means we count "Unique Visits" (1 per tab session), not "Page Views".

        const hasVisited = sessionStorage.getItem('visited_session_v1');

        if (!hasVisited) {
            // New Session! Record it.
            fetch('/api/analytics/record', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ path: pathname })
            }).catch(err => console.error('Analytics tracker failed', err));

            // Mark session as visited
            sessionStorage.setItem('visited_session_v1', 'true');
        }
    }, []); // Run once on mount (per reload/navigation). 
    // Actually, Next.js Single Page App navigation doesn't reload.
    // If we want "Entries to the site", simple mount check is enough if this component is in Root Layout.
    // Even if user navigates inside, we don't want to count again.
    // sessionStorage persists as long as tab is open. so refreshing -> counts as new visit? No, sessionStorage survives refresh.
    // So this is strictly "Browser Tab Sessions". Perfect for "Visits".

    return null; // Render nothing
}
