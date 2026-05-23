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
import ClerkBrandingTranslator from "./components/ClerkBrandingTranslator";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import PushManager from "./components/PushManager";
import SmartAdvisorTab from "./components/SmartAdvisorTab";
import { getBrand } from "./lib/brand";

// Validate env vars on server start/request
validateEnv();

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-assistant",
  display: "swap",
});

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-dancing-script",
  display: "swap",
});

export const viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export async function generateMetadata() {
  const brand = await getBrand();
  return {
    title: {
      template: `%s | ${brand.name}`,
      default: brand.fullTitle,
    },
    description: "חנות דוגמיות בשמים בקונספט קצת שונה. מגוון בשמי בוטיק, נישא ודיזיינר במחירים הוגנים",
    metadataBase: new URL('https://www.ml-tlv.com'),
    manifest: '/manifest.json',
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: brand.name,
      startupImage: [
        { url: '/icon-512.png', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)' },
        { url: '/icon-512.png', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)' },
        { url: '/icon-512.png', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)' },
        { url: '/icon-512.png', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)' },
      ],
    },
    openGraph: {
      title: brand.fullTitle,
      description: "חנות דוגמיות בשמים הגדולה בישראל",
      url: 'https://www.ml-tlv.com',
      siteName: brand.name,
      images: [{ url: '/logo_v5.png', width: 800, height: 600 }],
      locale: 'he_IL',
      type: 'website',
    },
  };
}

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
          logoImageUrl: '/logo_v5.png',
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
          clerkBranding: {},
          modalCloseButton: { display: 'none !important' }
        }
      }}
    >
      <html lang={locale} dir={dir} style={{ colorScheme: 'light' }}>
        <body className={`${assistant.variable} ${dancingScript.variable} antialiased`}>
          <LanguageProvider initialLocale={locale}>
            <CartProvider>
              <WishlistProvider>
              <AnalyticsTracker />
              {locale === 'he' && <ClerkBrandingTranslator />}
              <Toaster position="top-center" toastOptions={{ 
                duration: 3000,
                style: {
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  maxWidth: '90vw',
                  padding: '12px 24px',
                }
              }} />

              <ClientLayout brands={brands} menu={menu}>
                {children}
              </ClientLayout>

              <SmartAdvisorTab />

              <GoogleAnalytics />
              <MicrosoftClarity />
              <ServiceWorkerRegistration />
              <PushManager />

              {/* SEO: Organization/Store Schema */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify([
                      {
                        "@context": "https://schema.org",
                        "@type": "Store",
                        "name": "ml-tlv - יוקרה בחתיכות קטנות",
                        "url": "https://www.ml-tlv.com",
                        "logo": "https://www.ml-tlv.com/logo_v5.png",
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
                        "priceRange": "₪29-₪199",
                        "aggregateRating": {
                          "@type": "AggregateRating",
                          "ratingValue": "4.9",
                          "reviewCount": "542",
                          "bestRating": "5"
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
                      },
                      {
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                          {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "דף הבית",
                            "item": "https://www.ml-tlv.com"
                          }
                        ]
                      }
                    ])
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
