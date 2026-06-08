import Link from "next/link";
import Image from "@/app/components/CImage";
import pool from "./lib/db";
import ProductCard from "./components/ProductCard";
import LiveStats from "./components/LiveStats";
import BonusesSection from "./components/BonusesSection";
import BrandCarousel from "./components/BrandCarousel";
import HomeSEOContent from "./components/HomeSEOContent";
import HomeClient from "./components/HomeClient";
import TrustSection from "./components/TrustSection";
import HeroCarousel from "./components/HeroCarousel";
import TypewriterText from "./components/TypewriterText";
import HomeFAQSection from "./components/HomeFAQSection";
import { withClient } from "./lib/db";
import { cookies } from 'next/headers';
import he from './data/locales/he.json';
import en from './data/locales/en.json';
import { sanitizeProductArray } from "./lib/productUtils";
import FadeIn from "./components/FadeIn";
import { getHomeData } from "./lib/data/homeData";


const getT = (locale) => {
  const dict = locale === 'en' ? en : he;
  return (key) => {
    const keys = key.split('.');
    let result = dict;
    for (const k of keys) {
      if (result[k]) result = result[k];
      else return key;
    }
    return result;
  };
};


export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
  const t = getT(locale);

  return {
    title: t('metadata.home.title'),
    description: t('metadata.home.description'),
    alternates: {
      canonical: 'https://www.ml-tlv.com',
    },
  };
}

export default async function Home() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
  const t = getT(locale);

  const { newArrivals, topCatalogs, stats, banners } = await getHomeData();

  return (
    <div className="flex flex-col min-h-screen overflow-x-hidden">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([
            {
              "@context": "https://schema.org",
              "@type": "WebPage",
              "name": locale === 'he' ? "ml-tlv — דוגמיות בשמים יוקרתיות ודיקאנטים" : "ml-tlv — Luxury Perfume Samples & Decants",
              "speakable": {
                "@type": "SpeakableSpecification",
                "cssSelector": [
                  ".direct-answer-paragraph",
                  ".seo-content h2",
                  ".seo-content h3"
                ]
              }
            }
          ])
        }}
      />
      {/* Hero Section - Tall and pulled to top on mobile */}
      <section className="relative h-[85vh] md:h-[82vh] w-full m-0 p-0 overflow-hidden bg-white block !-mt-20 md:mt-0">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <HeroCarousel 
            banners={banners} 
            contentOverlays={banners.map((banner, i) => (
              !banner.hideContentBox ? (
                <div key={i} 
                     className="w-max md:w-[var(--desktop-width)] max-w-[130vw] text-black text-center content-box-bg px-3 py-2 md:px-5 md:py-3 rounded-2xl backdrop-blur-md shadow-2xl border border-white/20"
                     style={{ '--desktop-width': banner.boxWidthDesktop > 0 ? `${banner.boxWidthDesktop}px` : undefined }}
                >
                  {locale === 'en' && banner.contentEn ? (
                      <div className="whitespace-normal px-0 max-w-none mx-auto text-sm banner-text-content lang-en" style={{ lineHeight: banner.lineHeight || '1.5' }} dangerouslySetInnerHTML={{ __html: banner.contentEn }} />
                  ) : (locale !== 'en' && banner.contentHe) ? (
                      <div className="whitespace-normal px-0 max-w-none mx-auto text-sm banner-text-content lang-he" style={{ lineHeight: banner.lineHeight || '1.5' }} dangerouslySetInnerHTML={{ __html: banner.contentHe }} />
                  ) : (
                      <>
                        <h2 className="text-xs md:text-sm font-assistant tracking-[0.2em] uppercase mb-1 opacity-90 animate-fadeIn font-bold">
                          {t('homepage.discover_sig')}
                        </h2>
                        <h1 className="font-handwriting text-[1.35rem] md:text-5xl mb-2 md:mb-3 text-black leading-tight tracking-wide">
                          <span className="block whitespace-nowrap">{t('homepage.hero_title_p1')}</span>
                          <span className="block whitespace-nowrap">{t('homepage.hero_title_p2')}</span>
                        </h1>
                        <p className="text-xs md:text-base text-gray-800 mb-3 md:mb-4 font-assistant leading-relaxed max-w-none mx-auto opacity-80">
                          <TypewriterText
                            text={`${t('common.hero_subtitle')} ${t('common.hero_tagline_p1')} ${t('common.hero_tagline_p2')} ${t('common.hero_cta')}`}
                            speed={35}
                            delay={0}
                          />
                        </p>
                      </>
                  )}
                  <Link href={banner.btnLink || "/catalog"} className="inline-block border px-6 py-2.5 text-xs md:text-sm font-bold tracking-widest transition duration-500 uppercase rounded-full border-[var(--btn-border)] text-[var(--btn-text)] hover:bg-white hover:text-black hover:border-white"
                    style={{ '--btn-text': banner.btnTextColor || '#000', '--btn-border': banner.btnBorderColor || '#000', marginTop: `${banner.buttonMarginTop ?? 16}px` }}>
                    {locale === 'en' ? (banner.btnTextEn || t('homepage.shop_now')) : (banner.btnTextHe || t('homepage.shop_now'))}
                  </Link>
                </div>
              ) : null
            ))}
          />
        </div>
      </section>

      <div className="relative z-30 bg-white w-full flex flex-col -mt-14 md:mt-0">
        <FadeIn delay={0.1}>
          <LiveStats stats={stats} />
        </FadeIn>
        <FadeIn delay={0.2}>
          <HomeClient newArrivals={newArrivals} topCatalogs={topCatalogs} />
        </FadeIn>
        <FadeIn delay={0.1}>
          <BonusesSection />
        </FadeIn>
        <FadeIn delay={0.1}>
          <BrandCarousel brands={stats.allBrands} />
        </FadeIn>
        <FadeIn delay={0.1}>
          <TrustSection />
        </FadeIn>
      </div>

      <FadeIn>
        <section className="py-12 bg-white border-t">
          <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/catalog?category=נדיר" className="group relative h-[400px] overflow-hidden rounded-lg">
              <Image src="/collection-exclusive.png" alt={t('homepage.exclusive_title').replace('\n', ' ')} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                <span className="text-sm tracking-[0.2em] uppercase mb-2">{t('homepage.exclusive_tagline')}</span>
                <h3 className="text-3xl font-serif font-medium mb-4 whitespace-pre-line">{t('homepage.exclusive_title')}</h3>
                <div className="w-8 h-0.5 bg-white mb-4" />
                <span className="text-xs font-bold underline decoration-1 underline-offset-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-300">{t('homepage.shop_collection')}</span>
              </div>
            </Link>
            <Link href="/catalog?category=קיץ" className="group relative h-[400px] overflow-hidden rounded-lg">
              <Image src="/collection-summer.png" alt={t('homepage.summer_title').replace('\n', ' ')} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                <span className="text-sm tracking-[0.2em] uppercase mb-2">{t('homepage.summer_tagline')}</span>
                <h3 className="text-3xl font-serif font-medium mb-4 whitespace-pre-line">{t('homepage.summer_title')}</h3>
                <div className="w-8 h-0.5 bg-white mb-4" />
                <span className="text-xs font-bold underline decoration-1 underline-offset-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-300">{t('homepage.shop_collection')}</span>
              </div>
            </Link>
            <Link href="/catalog?category=ערב" className="group relative h-[400px] overflow-hidden rounded-lg">
              <Image src="/collection-datenight.png" alt={t('homepage.datenight_title').replace('\n', ' ')} fill className="object-cover transition-transform duration-700 group-hover:scale-110" />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                <span className="text-sm tracking-[0.2em] uppercase mb-2">{t('homepage.datenight_tagline')}</span>
                <h3 className="text-3xl font-serif font-medium mb-4 whitespace-pre-line">{t('homepage.datenight_title')}</h3>
                <div className="w-8 h-0.5 bg-white mb-4" />
                <span className="text-xs font-bold underline decoration-1 underline-offset-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-300">{t('homepage.shop_collection')}</span>
              </div>
            </Link>
          </div>
        </div>
      </section>
      </FadeIn>
      <FadeIn delay={0.1}>
        <HomeFAQSection />
      </FadeIn>
      <HomeSEOContent />
    </div>
  );
}
