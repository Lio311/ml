import Link from "next/link";
import Image from "next/image";
import pool from "../lib/db";
import ProductCard from "../components/ProductCard";
import LiveStats from "../components/LiveStats";
import { Dancing_Script } from "next/font/google";
import BonusesSection from "../components/BonusesSection";
import BrandCarousel from "../components/BrandCarousel";
import HomeSEOContent from "../components/HomeSEOContent";
import HomeClient from "../components/HomeClient";
import { withClient } from "../lib/db";
import { cookies } from 'next/headers';
import he from '../data/locales/he.json';
import en from '../data/locales/en.json';

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
  weight: "700", // Bold for impact
});

export const dynamic = 'force-dynamic';

export async function generateMetadata() {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
  const t = getT(locale);

  return {
    title: t('metadata.home.title') + ' (V2)',
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
  let stats = { brands: 0, products: 0, samples: 500 };

  try {
    await withClient(async (client) => {
      // Fetch New Arrivals (Only in stock)
      const res = await client.query('SELECT * FROM products WHERE active = true AND stock > 0 ORDER BY created_at DESC LIMIT 6');
      newArrivals = res.rows;

      // Fetch Stats
      try {
        const productCountRes = await client.query('SELECT COUNT(*) FROM products WHERE active = true');
        const brandCountRes = await client.query('SELECT COUNT(DISTINCT brand) FROM products WHERE active = true');

        stats.products = parseInt(productCountRes.rows[0].count);
        stats.brands = parseInt(brandCountRes.rows[0].count);

        // Fetch all brands for carousel (Randomized) 
        const brandsRes = await client.query('SELECT name, logo_url FROM brands WHERE logo_url IS NOT NULL ORDER BY RANDOM()');
        stats.allBrands = brandsRes.rows;

        // Try to get orders count for samples estimation
        try {
          const ordersRes = await client.query("SELECT items FROM orders WHERE status != 'cancelled'");
          const totalSamplesSold = ordersRes.rows.reduce((acc, row) => {
            const items = row.items || [];
            const orderSum = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
            return acc + orderSum;
          }, 0);
          stats.samples += totalSamplesSold;
        } catch (e) {}
      } catch (e) {
        console.error("Stats error", e);
      }

      // Fetch Top Catalogs
      try {
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
      } catch (e) {
        console.error("Top catalogs error", e);
      }
    });
  } catch (err) {
    console.error("Error fetching homepage data:", err);
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section - Increased height and moved to top */}
      <section className="relative h-[80vh] w-full m-0 p-0 overflow-hidden bg-black block">
        <div className="absolute inset-0 w-full h-full overflow-hidden bg-gray-100">
          <video
            autoPlay
            loop
            muted
            playsInline
            preload="auto"
            fetchpriority="high"
            className="absolute inset-0 w-full h-full object-cover scale-[1.05]"
          >
            <source src="/hero-video.mp4" type="video/mp4" />
          </video>
        </div>

        <div className="absolute inset-0 z-10 container mx-auto flex items-center justify-center px-6 md:px-12">
          {/* Hero Content Box */}
          <div className="max-w-xs md:max-w-lg text-black text-center bg-white/85 p-6 rounded-2xl backdrop-blur-md shadow-2xl transform scale-90 md:scale-100 origin-center border border-white/20">
            <h2 className="text-xs md:text-sm font-assistant tracking-[0.2em] uppercase mb-1 opacity-90 animate-fadeIn font-bold">
              {t('homepage.discover_sig')}
            </h2>
            <h1 className={`${dancingScript.className} text-3xl md:text-6xl mb-2 md:mb-4 text-black leading-tight tracking-wide`}>
              {t('homepage.hero_title_p1')} {t('homepage.hero_title_p2')}
            </h1>
            <p className="text-xs md:text-base text-gray-800 mb-3 md:mb-4 font-light leading-relaxed">
              {t('common.hero_subtitle')} {t('common.hero_tagline')} {t('common.hero_cta')}
            </p>
            <Link href="/catalog" className="inline-block border text-black border-black px-8 py-3 text-xs md:text-sm font-bold tracking-widest hover:bg-black hover:text-white transition duration-500 uppercase rounded-full">
              {t('homepage.shop_now')}
            </Link>
          </div>
        </div>
      </section>

      <div className="-mt-16 relative z-30">
        <LiveStats stats={stats} />
      </div>
      <HomeClient newArrivals={newArrivals} topCatalogs={topCatalogs} />
      <BonusesSection />
      <BrandCarousel brands={stats.allBrands} />

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
      <HomeSEOContent />
    </div>
  );
}
