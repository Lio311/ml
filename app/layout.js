import { Assistant, Dancing_Script } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { heIL } from "@clerk/localizations";
import "./globals.css";
import AnalyticsTracker from "./components/AnalyticsTracker";
import GoogleAnalytics from "./components/GoogleAnalytics";
import MicrosoftClarity from "./components/MicrosoftClarity";
import ClientLayout from "./components/ClientLayout";

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

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
};

export const metadata = {
  title: "יוקרה בחתיכות קטנות",
  description: "חנות דוגמיות בשמים בקונספט קצת שונה. מגוון בשמי בוטיק, נישה ודיזיינר במחירים הוגנים",
  metadataBase: new URL(process.env.NEXT_PUBLIC_BASE_URL || 'https://ml-tlv.com'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ml_tlv',
  },
  icons: {
    icon: '/ml_v4.png',
    apple: '/apple-touch-icon.png',
  },
  openGraph: {
    title: "ml_tlv | דוגמיות בשמים",
    description: "חנות דוגמיות בשמים הגדולה בישראל",
    url: 'https://ml-tlv.com',
    siteName: 'ml_tlv',
    images: [
      {
        url: '/logo_v5.png',
        width: 800,
        height: 600,
      },
    ],
    locale: 'he_IL',
    type: 'website',
  },
};

import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";

import pool from "./lib/db";

import { Toaster } from 'react-hot-toast';

export default async function RootLayout({ children }) {
  // Fetch Brands and Menu for Navigation (Server Side)
  let brands = [];
  let menu = [];
  try {
    const client = await pool.connect();
    const brandsRes = await client.query('SELECT name FROM brands ORDER BY LOWER(name) ASC');
    brands = brandsRes.rows;

    // Hardcoded menu (instead of loading from settings table)
    menu = [
      { id: 1, label: 'מותגים', path: '/brands', order: 1, isDropdown: true },
      { id: 2, label: 'קטגוריות', path: '/categories', order: 2 },
      { id: 3, label: 'הגרלת בשמים', path: '/lottery', order: 3, isRed: true },
      { id: 4, label: 'התאמת מארזים', path: '/matching', order: 4 },
      { id: 5, label: 'אודות', path: '/about', order: 5 },
      { id: 6, label: 'צור קשר', path: '/contact', order: 6 },
    ];

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
        },
        elements: {
          formButtonPrimary__icon: {
            transform: 'rotate(180deg) !important'
          },
          otpCodeFieldInput: {
            direction: 'ltr !important',
            textAlign: 'center !important'
          },
          identityPreviewText: {
            direction: 'ltr !important'
          }
        }
      }}
    >
      <html lang="he" dir="rtl">
        <body className={assistant.className}>
          <CartProvider>
            <WishlistProvider>
              <AnalyticsTracker />
              <Toaster position="top-center" toastOptions={{ duration: 3000 }} />

              <ClientLayout brands={brands} menu={menu}>
                {children}
              </ClientLayout>

              <GoogleAnalytics />
              <MicrosoftClarity />

              {/* SEO: Organization Schema */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                  __html: JSON.stringify({
                    "@context": "https://schema.org",
                    "@type": "Organization",
                    "name": "ml_tlv",
                    "url": "https://ml-tlv.com",
                    "logo": "https://ml-tlv.com/logo_v3.png",
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
