"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import ChatWidget from "./Chatbot/ChatWidget";
import AccessibilityWidget from "./AccessibilityWidget";
import InstagramPopup from "./InstagramPopup";
import SwipeNavigator from "./SwipeNavigator";

export default function ClientLayout({ children, brands, menu }) {
    const pathname = usePathname();
    // Only hide header if we're in admin
    const isAdmin = pathname && typeof pathname === 'string' && pathname.startsWith('/admin');

    if (isAdmin) {
        return (
            <>
                <div id="site-content">
                    <main className="min-h-screen">
                        {children}
                    </main>
                </div>
            </>
        );
    }

    const isHome = pathname === '/';

    return (
        <>
            <div id="site-content">
                <Header brands={brands} />
                <main className={`min-h-screen ${!isHome ? 'pt-20 md:pt-28' : ''}`}>
                    {children}
                </main>
                <Footer />
            </div>

            <ChatWidget />
            <AccessibilityWidget />
            <InstagramPopup />
            <SwipeNavigator />
        </>
    );
}
