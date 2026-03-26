"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import HeaderV2 from "./v2/HeaderV2";
import Footer from "./Footer";
import ChatWidget from "./Chatbot/ChatWidget";
import AccessibilityWidget from "./AccessibilityWidget";
import InstagramPopup from "./InstagramPopup";

export default function ClientLayout({ children, brands, menu }) {
    const pathname = usePathname();
    // Only hide header if we're in admin
    const isAdmin = pathname && typeof pathname === 'string' && pathname.startsWith('/admin');
    const isV2 = pathname && typeof pathname === 'string' && pathname.startsWith('/v2');

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

    return (
        <>
            <div id="site-content">
                {isV2 ? <HeaderV2 brands={brands} /> : <Header brands={brands} menu={menu} />}
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
