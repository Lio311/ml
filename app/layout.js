import { Assistant, Dancing_Script } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { heIL, enUS } from "@clerk/localizations";
import "./globals.css";
import AnalyticsTracker from "./components/AnalyticsTracker";
import GoogleAnalytics from "./components/GoogleAnalytics";
import MicrosoftClarity from "./components/MicrosoftClarity";
import ClientLayout from "./components/ClientLayout";
import { validateEnv } from "./lib/env";
import { headers, cookies } from "next/headers";
import { LanguageProvider } from "./context/LanguageContext";
import { BrandProvider } from "./context/BrandContext";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import pool, { getBrands, getMenuItems } from "./lib/db";
import { sanitizeProductArray } from "./lib/productUtils";
import { Toaster } from 'react-hot-toast';
import ClerkBrandingTranslator from "./components/ClerkBrandingTranslator";
import ServiceWorkerRegistration from "./components/ServiceWorkerRegistration";
import CookieConsent from "./components/ui/CookieConsent";
import { getBrand } from "./lib/brand";
import BackgroundCronTrigger from "./components/BackgroundCronTrigger";

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
    metadataBase: new URL(brand.url),
    icons: {
      icon: '/api/assets/logo?type=favicon',
      apple: '/api/assets/logo?type=icon_apple',
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: 'black-translucent',
      title: brand.name,
      startupImage: [
        { url: '/api/assets/logo?type=icon_512', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)' },
        { url: '/api/assets/logo?type=icon_512', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)' },
        { url: '/api/assets/logo?type=icon_512', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)' },
        { url: '/api/assets/logo?type=icon_512', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)' },
      ],
    },
    openGraph: {
      title: brand.fullTitle,
      description: "חנות דוגמיות בשמים הגדולה בישראל",
      url: brand.url,
      siteName: brand.name,
      images: [{ url: '/api/assets/logo?type=logo_fallback', width: 800, height: 600 }],
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

  const headersList = await headers();
  const forceMaintenance = headersList.get('x-maintenance') === 'true';
  const brand = await getBrand();

  return (
    <ClerkProvider
      localization={clerkLocale}
      appearance={{
        layout: {
          logoImageUrl: '/api/assets/logo?type=logo_header',
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
          <BrandProvider initialBrand={brand}>
            <LanguageProvider initialLocale={locale}>
              <CartProvider>
                <WishlistProvider>
                <AnalyticsTracker />
                {locale === 'he' && <ClerkBrandingTranslator />}
              {!forceMaintenance && (
                <Toaster position="top-center" toastOptions={{ 
                  duration: 3000,
                  style: {
                    textAlign: 'center',
                    whiteSpace: 'nowrap',
                    maxWidth: '90vw',
                    padding: '12px 24px',
                  }
                }} />
              )}

              <ClientLayout brands={brands} menu={menu} forceMaintenance={forceMaintenance}>
                {children}
              </ClientLayout>

              <GoogleAnalytics />
              <MicrosoftClarity />
              <ServiceWorkerRegistration />
              <CookieConsent />
              <BackgroundCronTrigger />

              {/* SEO: Organization/Store/WebSite Schema */}
              <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify([
                      {
                        "@context": "https://schema.org",
                        "@type": "Store",
                        "name": brand.name,
                        "alternateName": `${brand.name} - יוקרה בחתיכות קטנות`,
                        "url": brand.url,
                        "logo": `${brand.url}/api/assets/logo?type=logo_fallback`,
                        "image": `${brand.url}/api/assets/logo?type=logo_fallback`,
                        "description": locale === 'he' 
                            ? "דוגמיות בשמים, דיקאנטים ובשמי נישה מקוריים בתל אביב והסביבה. משלוחים לכל הארץ."
                            : "Authentic luxury niche perfume samples and decants.",
                        "telephone": "+972-50-000-0000",
                        "address": {
                          "@type": "PostalAddress",
                          "streetAddress": "Milano Square",
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
                          `https://instagram.com/${brand.instagram}`
                        ]
                      },
                      {
                        "@context": "https://schema.org",
                        "@type": "WebSite",
                        "name": brand.name,
                        "alternateName": brand.name,
                        "url": brand.url,
                        "image": `${brand.url}/api/assets/logo?type=logo_fallback`,
                        "description": locale === 'he'
                            ? `${brand.name} - דוגמיות בושם מקוריות מבתי בושם יוקרתיים ונישה. דיקאנטים ב-2, 5 ו-10 מ"ל באריזת זכוכית עם מתז.`
                            : `${brand.name} - Authentic luxury niche perfume samples and decants in 2ml, 5ml, and 10ml glass atomizers.`,
                        "inLanguage": ["he-IL", "en-US"],
                        "potentialAction": {
                            "@type": "SearchAction",
                            "target": `${brand.url}/catalog?q={search_term_string}`,
                            "query-input": "required name=search_term_string"
                        }
                      },
                      {
                        "@context": "https://schema.org",
                        "@type": "Person",
                        "name": "Lio",
                        "jobTitle": "Founder",
                        "worksFor": {
                            "@type": "Organization",
                            "name": brand.name
                        }
                      },
                      {
                        "@context": "https://schema.org",
                        "@type": "ItemList",
                        "name": "Site Navigation",
                        "itemListElement": [
                          { "@type": "SiteNavigationElement", "position": 1, "name": "קטלוג", "url": `${brand.url}/catalog` },
                          { "@type": "SiteNavigationElement", "position": 2, "name": "גברים", "url": `${brand.url}/catalog?gender=men` },
                          { "@type": "SiteNavigationElement", "position": 3, "name": "נשים", "url": `${brand.url}/catalog?gender=women` },
                          { "@type": "SiteNavigationElement", "position": 4, "name": "חבילות", "url": `${brand.url}/bundles` },
                          { "@type": "SiteNavigationElement", "position": 5, "name": "דיסקברי סט", "url": `${brand.url}/discovery-sets` }
                        ]
                      },
                      {
                        "@context": "https://schema.org",
                        "@type": "WebPage",
                        "name": brand.name,
                        "url": brand.url,
                        "primaryImageOfPage": {
                          "@type": "ImageObject",
                          "url": `${brand.url}/api/assets/logo?type=logo_fallback`
                        }
                      },
                      {
                        "@context": "https://schema.org",
                        "@type": "BreadcrumbList",
                        "itemListElement": [
                          {
                            "@type": "ListItem",
                            "position": 1,
                            "name": "דף הבית",
                            "item": brand.url
                          }
                        ]
                      }
                    ])
                }}
              />
                </WishlistProvider>
              </CartProvider>
            </LanguageProvider>
          </BrandProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
