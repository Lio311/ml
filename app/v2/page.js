import Link from "next/link";
import Image from "next/image";
import pool from "../lib/db";
import { Dancing_Script } from "next/font/google";
import BonusesSection from "../components/BonusesSection";
import BrandCarousel from "../components/BrandCarousel";
import HomeSEOContent from "../components/HomeSEOContent";
import HomeClient from "../components/HomeClient";
import { withClient } from "../lib/db";
import { cookies } from 'next/headers';
import he from '../data/locales/he.json';
import en from '../data/locales/en.json';

// V2 Components
import HeaderV2 from "./HeaderV2";
import GlassPanel from "./GlassPanel";
import FixedWidgets from "./FixedWidgets";

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

const dancingScript = Dancing_Script({
  subsets: ["latin"],
  weight: "700",
});

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
  const t = getT(locale);

  return {
    title: t('metadata.home.title') + ' | V2',
    description: t('metadata.home.description'),
    alternates: {
      canonical: 'https://www.ml-tlv.com/v2',
    },
    robots: {
        index: false,
        follow: false,
    }
  };
}

export default async function HomeV2() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
  const t = getT(locale);

  let newArrivals = [];
  let topCatalogs = [];
  let stats = { brands: 0, products: 0, samples: 500, allBrands: [] };

  try {
    await withClient(async (client) => {
      // Fetch New Arrivals
      const res = await client.query('SELECT * FROM products WHERE active = true AND stock > 0 ORDER BY created_at DESC LIMIT 6');
      newArrivals = res.rows;

      // Fetch Stats
      const productCountRes = await client.query('SELECT COUNT(*) FROM products WHERE active = true');
      const brandCountRes = await client.query('SELECT COUNT(DISTINCT brand) FROM products WHERE active = true');

      stats.products = parseInt(productCountRes.rows[0].count);
      stats.brands = parseInt(brandCountRes.rows[0].count);

      const brandsRes = await client.query('SELECT id, name, logo_url FROM brands WHERE logo_url IS NOT NULL ORDER BY RANDOM()');
      stats.allBrands = brandsRes.rows;

      try {
        const ordersRes = await client.query("SELECT items FROM orders WHERE status != 'cancelled'");
        const totalSamplesSold = ordersRes.rows.reduce((acc, row) => {
          const items = row.items || [];
          const orderSum = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
          return acc + orderSum;
        }, 0);
        stats.samples += totalSamplesSold;
      } catch (e) {}

      // Fetch Top Catalogs
      const topCatRes = await client.query(`
          SELECT c.id, c.name, c.slug, c.description, c.image_url, COUNT(o.id) as order_count
          FROM user_catalogs c
          LEFT JOIN orders o ON c.id = o.catalog_id
          WHERE c.is_hidden IS FALSE OR c.is_hidden IS NULL
          GROUP BY c.id
          ORDER BY order_count DESC, c.created_at DESC
          LIMIT 3
      `);
      topCatalogs = topCatRes.rows;
    });
  } catch (err) {
    console.error("Error fetching homepage data:", err);
  }

  return (
    <div className="flex flex-col min-h-screen">
      <HeaderV2 brands={stats.allBrands} />

      <main className="flex-1 pt-32 pb-20 px-6">
        
        {/* Anti-Gravity Hero Panel */}
        <section className="container mx-auto flex flex-col items-center mb-20 lg:mb-32">
          <GlassPanel 
            className="max-w-3xl w-full text-center p-12 md:p-20 relative overflow-hidden group"
            parallax="slow"
          >
            <div className="relative z-10">
              <h2 className="text-xs md:text-sm font-sans tracking-[0.3em] uppercase mb-4 text-white/50 animate-fadeIn font-bold">
                {t('homepage.discover_sig')}
              </h2>
              <h1 className={`${dancingScript.className} text-4xl md:text-7xl mb-8 text-white leading-tight tracking-wide drop-shadow-2xl`}>
                {t('homepage.hero_title_p1')} <br/> {t('homepage.hero_title_p2')}
              </h1>
              <p className="text-sm md:text-lg text-white/70 mb-10 font-light leading-relaxed max-w-xl mx-auto">
                {t('common.hero_subtitle')} {t('common.hero_tagline')}
              </p>
              <Link 
                href="/catalog" 
                className="inline-block bg-white text-black px-10 py-4 text-xs md:text-sm font-bold tracking-[0.2em] hover:bg-transparent hover:text-white border border-white transition-all duration-500 uppercase rounded-full"
              >
                {t('homepage.shop_now')}
              </Link>
            </div>
            
            {/* Subtle internal animated glow */}
            <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent"></div>
          </GlassPanel>
        </section>

        {/* Anti-Gravity Statistics Panel */}
        <section className="container mx-auto flex justify-center mb-32">
          <GlassPanel 
            className="w-full max-w-5xl py-12 px-6 md:px-20"
            parallax="fast"
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-4 divide-y md:divide-y-0 md:divide-x md:divide-white/10 divide-white/5">
              
              {/* Brands Stat */}
              <div className="flex flex-col items-center justify-center p-4 group">
                <div className="w-16 h-16 mb-6 rounded-full glass flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-8 h-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                </div>
                <span className="text-4xl md:text-5xl font-serif text-white mb-2">{stats.brands}</span>
                <span className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold">מותגים</span>
              </div>

              {/* Products Stat */}
              <div className="flex flex-col items-center justify-center p-4 group border-r border-white/10">
                <div className="w-16 h-16 mb-6 rounded-full glass flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                    <svg className="w-8 h-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                </div>
                <span className="text-4xl md:text-5xl font-serif text-white mb-2">{stats.products}</span>
                <span className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold">בשמים באתר</span>
              </div>

              {/* Samples Stat */}
              <div className="flex flex-col items-center justify-center p-4 group border-r border-white/10">
                <div className="w-16 h-16 mb-6 rounded-full glass flex items-center justify-center group-hover:scale-110 transition-transform duration-500 glow-hover">
                    <svg className="w-8 h-8 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                </div>
                <span className="text-4xl md:text-5xl font-serif text-white mb-2">+{stats.samples}</span>
                <span className="text-xs uppercase tracking-[0.3em] text-white/40 font-bold">דוגמיות שנמכרו</span>
              </div>

            </div>
          </GlassPanel>
        </section>

        {/* Existing Content - Kept in background context */}
        <div className="relative z-0 opacity-80 scale-95 origin-top pointer-events-none">
            <HomeClient newArrivals={newArrivals} topCatalogs={topCatalogs} />
            <BonusesSection />
            <BrandCarousel brands={stats.allBrands} />
            <HomeSEOContent />
        </div>

      </main>

      <FixedWidgets />
      
      <div className="fixed top-0 left-0 w-full h-screen pointer-events-none z-0">
          <div className="absolute inset-0 bg-transparent"></div>
      </div>
    </div>
  );
}
