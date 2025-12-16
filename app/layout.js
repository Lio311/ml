import { Assistant, Dancing_Script } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { heIL } from "@clerk/localizations";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AnalyticsTracker from "./components/AnalyticsTracker";
import ChatWidget from "./components/Chatbot/ChatWidget";
import AccessibilityWidget from "./components/AccessibilityWidget";

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-assistant",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: "400", // or "500", "600", "700"
  variable: "--font-dancing-script",
});

export const metadata = {
  title: "יוקרה בחתיכות קטנות",
  description: "חנות דוגמיות בשמים בקונספט קצת שונה. מגוון בשמי בוטיק, נישה ודיזיינר במחירים הוגנים",
};

import { CartProvider } from "./context/CartContext";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      localization={heIL}
      appearance={{
        layout: {
          logoImageUrl: '/logo_v3.png',
          socialButtonsVariant: 'iconButton'
        },
        variables: {
          colorPrimary: '#000000',
        }
      }}
    >
      <html lang="he" dir="rtl">
        <body className={assistant.className}>
          <CartProvider>
            <AnalyticsTracker />
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
            <ChatWidget />
            <AccessibilityWidget />

            {/* SEO: Organization Schema */}
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{
                __html: JSON.stringify({
                  "@context": "https://schema.org",
                  "@type": "Organization",
                  "name": "ml_tlv",
                  "url": "https://ml-tlv.vercel.app",
                  "logo": "https://ml-tlv.vercel.app/logo_v3.png",
                  "description": "Luxury Niche Perfume Samples in Israel",
                  "sameAs": [
                    "https://instagram.com/ml_tlv"
                  ]
                })
              }}
            />
          </CartProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
