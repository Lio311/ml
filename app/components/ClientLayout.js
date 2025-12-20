"use client";

import { usePathname } from "next/navigation";
import Header from "./Header";
import Footer from "./Footer";
import ChatWidget from "./Chatbot/ChatWidget";
import AccessibilityWidget from "./AccessibilityWidget";

export default function ClientLayout({ children, brands }) {
    const pathname = usePathname();
    const isAdmin = pathname?.startsWith('/admin');

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
                <Header brands={brands} />
                <main className="min-h-screen">
                    {children}
                </main>
                <Footer />
            </div>

            <ChatWidget />
            <AccessibilityWidget />
        </>
    );
}
