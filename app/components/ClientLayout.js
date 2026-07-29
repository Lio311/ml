"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import ChatWidget from "./Chatbot/ChatWidget";
import AccessibilityWidget from "./AccessibilityWidget";
import PopupManager from "./PopupManager";
import SwipeNavigator from "./SwipeNavigator";
import SmartAdvisorTab from "./SmartAdvisorTab";
import MiniCart from "./MiniCart";
import PushManager from "./PushManager";
import WhatsAppButton from "./WhatsAppButton";

export default function ClientLayout({ children, brands, menu, forceMaintenance }) {
    const pathname = usePathname();
    const isAdmin = pathname && typeof pathname === 'string' && pathname.startsWith('/admin');
    const isMaintenance = forceMaintenance || pathname === '/maintenance';

    if (isAdmin || isMaintenance) {
        return (
            <div id="site-content">
                <main className="min-h-screen">
                    {children}
                </main>
            </div>
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
            <WhatsAppButton />
            <AccessibilityWidget />
            <PopupManager />
            <SwipeNavigator />
            <SmartAdvisorTab />
            <MiniCart />
            <PushManager />
        </>
    );
}
