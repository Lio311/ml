"use client";
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Generate or retrieve a stable session ID for funnel tracking
function getFunnelSessionId() {
    let sid = sessionStorage.getItem('funnel_session_id');
    if (!sid) {
        sid = `s_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        sessionStorage.setItem('funnel_session_id', sid);
    }
    return sid;
}

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

            // Also record funnel page_visit event
            const sessionId = getFunnelSessionId();
            fetch('/api/analytics/funnel', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, eventType: 'page_visit' })
            }).catch(err => console.error('Funnel tracker failed', err));

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

// Export the helper so CartContext and CartClient can use it
export { getFunnelSessionId };

