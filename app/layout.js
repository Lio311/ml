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
import { WishlistProvider } from "./context/WishlistContext";

import pool from "./lib/db";

export default async function RootLayout({ children }) {
  // Fetch Brands for Navigation (Server Side)
  let brands = [];
  try {
    const client = await pool.connect();
    const res = await client.query('SELECT name FROM brands WHERE logo_url IS NOT NULL ORDER BY LOWER(name) ASC');
    brands = res.rows;
    client.release();
  } catch (e) {
    console.error("Layout fetch error:", e);
  }

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
            <WishlistProvider>
              <AnalyticsTracker />

              <div id="site-content">
                <Header brands={brands} />
                <main className="min-h-screen">
                  {children}
                </main>
                <Footer />
              </div>

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
            </WishlistProvider>
          </CartProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
