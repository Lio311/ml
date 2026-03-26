"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import ChatWidget from "./Chatbot/ChatWidget";
import AccessibilityWidget from "./AccessibilityWidget";
import InstagramPopup from "./InstagramPopup";

export default function ClientLayout({ children, brands, menu }) {
    const pathname = usePathname();
    // Only hide header if we're in admin or v2 draft
    const isAdmin = pathname && typeof pathname === 'string' && pathname.startsWith('/admin');
    const isV2 = pathname && typeof pathname === 'string' && pathname.startsWith('/v2');

    if (isAdmin || isV2) {
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

    return (
        <>
            <div id="site-content">
                <Header brands={brands} menu={menu} />
                <main className="min-h-screen">
                    {children}
                </main>
                <Footer />
            </div>

            <ChatWidget />
            <AccessibilityWidget />
            <InstagramPopup />
        </>
    );
}
