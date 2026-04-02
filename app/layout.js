import { Assistant, Dancing_Script } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { heIL, enUS } from "@clerk/localizations";
import "./globals.css";
import AnalyticsTracker from "./components/AnalyticsTracker";
import GoogleAnalytics from "./components/GoogleAnalytics";
import MicrosoftClarity from "./components/MicrosoftClarity";
import ClientLayout from "./components/ClientLayout";
import { validateEnv } from "./lib/env";
import { cookies } from "next/headers";
import { LanguageProvider } from "./context/LanguageContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import pool, { getBrands, getMenuItems } from "./lib/db";
import { sanitizeProductArray } from "./lib/productUtils";
import { Toaster } from 'react-hot-toast';

// Validate env vars on server start/request
validateEnv();

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
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: "יוקרה בחתיכות קטנות",
  description: "חנות דוגמיות בשמים בקונספט קצת שונה. מגוון בשמי בוטיק, נישה ודיזיינר במחירים הוגנים",
  metadataBase: new URL('https://www.ml-tlv.com'),
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ml_tlv',
  },
  openGraph: {
    title: "ml_tlv | דוגמיות בשמים",
    description: "חנות דוגמיות בשמים הגדולה בישראל",
    url: 'https://www.ml-tlv.com',
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

export default async function RootLayout({ children }) {
  const brandsRaw = await getBrands();
  const menuRaw = await getMenuItems();
  
  const brands = sanitizeProductArray(brandsRaw);
  const menu = sanitizeProductArray(menuRaw);
  
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
  const dir = locale === 'he' ? 'rtl' : 'ltr';
  const clerkLocale = locale === 'he' ? heIL : enUS;

  return (
    <ClerkProvider
      localization={clerkLocale}
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
          },
          clerkBranding: locale === 'he' ? {
            position: 'relative',
            backgroundColor: 'white',
            '&::before': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'white',
              zIndex: 1,
            },
            '&::after': {
              content: '"מאובטח על ידי Clerk"',
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#6c7278',
              fontSize: '11px',
              zIndex: 2,
              pointerEvents: 'none',
              whiteSpace: 'nowrap',
            }
          } : {}
        }
      }}
    >
      <html lang={locale} dir={dir}>
        <body className={`${assistant.variable} ${dancingScript.variable} antialiased`}>
          <LanguageProvider initialLocale={locale}>
            <CartProvider>
              <WishlistProvider>
              <AnalyticsTracker />
              <Toaster position="top-center" toastOptions={{ 
                duration: 3000,
                style: {
                  textAlign: 'center',
                }
              }} />

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
                      "@type": "Store",
                      "name": "ml_tlv - יוקרה בחתיכות קטנות",
                      "url": "https://www.ml-tlv.com",
                      "logo": "https://www.ml-tlv.com/logo_v3.png",
                      "image": "https://www.ml-tlv.com/logo_v5.png",
                      "description": "דוגמיות בשמים, דיקאנטים ובשמי נישה מקוריים בתל אביב והסביבה. משלוחים לכל הארץ.",
                      "address": {
                        "@type": "PostalAddress",
                        "addressLocality": "Tel Aviv",
                        "addressCountry": "IL"
                      },
                      "geo": {
                        "@type": "GeoCoordinates",
                        "latitude": 32.0853,
                        "longitude": 34.7818
                      },
                      "openingHoursSpecification": {
                        "@type": "OpeningHoursSpecification",
                        "dayOfWeek": [
                          "Sunday",
                          "Monday",
                          "Tuesday",
                          "Wednesday",
                          "Thursday"
                        ],
                        "opens": "09:00",
                        "closes": "20:00"
                      },
                      "sameAs": [
                        "https://instagram.com/ml_tlv"
                      ]
                    })
                }}
              />
              </WishlistProvider>
            </CartProvider>
          </LanguageProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
