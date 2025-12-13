import Link from "next/link";
import Image from "next/image";
import pool from "./lib/db";
import ProductCard from "./components/ProductCard";
import LiveStats from "./components/LiveStats";
import BrandCarousel from "./components/BrandCarousel";

export const dynamic = 'force-dynamic';

export default async function Home() {
  let newArrivals = [];
  let stats = { brands: 0, products: 0, samples: 500 };

  try {
    const client = await pool.connect();

    // Fetch New Arrivals
    const res = await client.query('SELECT * FROM products ORDER BY id DESC LIMIT 4');
    newArrivals = res.rows;

    // Fetch Stats
    try {
      const productCountRes = await client.query('SELECT COUNT(*) FROM products WHERE active = true');
      const brandCountRes = await client.query('SELECT COUNT(DISTINCT brand) FROM products WHERE active = true');

      stats.products = parseInt(productCountRes.rows[0].count);
      stats.brands = parseInt(brandCountRes.rows[0].count);

      // Fetch all brands for carousel
      const brandsRes = await client.query('SELECT name, logo_url FROM brands WHERE logo_url IS NOT NULL ORDER BY name');
      stats.allBrands = brandsRes.rows;

      // Try to get orders count for samples estimation
      try {
        const ordersRes = await client.query('SELECT items FROM orders');
        const totalSamplesSold = ordersRes.rows.reduce((acc, row) => {
          const items = row.items || [];
          // items is array of objects { quantity: 1, ... }
          const orderSum = items.reduce((sum, item) => sum + (parseInt(item.quantity) || 0), 0);
          return acc + orderSum;
        }, 0);
        stats.samples += totalSamplesSold;
      } catch (e) {
        // Orders table might not exist or be empty, ignore
      }
    } catch (e) {
      console.error("Stats error", e);
    }

    client.release();
  } catch (err) {
    console.error("Error fetching homepage data:", err);
  }

  return (
    <div className="flex flex-col min-h-screen">

      {/* Hero Section */}
      <section className="relative h-[50vh] flex items-center justify-center bg-[#F8F5F2] text-center overflow-hidden">
        {/* Decorative Background Video */}
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>

        <div className="absolute inset-0 z-10 container mx-auto flex items-center justify-center px-6 md:px-12">
          <div className="max-w-lg text-black text-center bg-white/80 p-4 md:p-6 rounded-xl backdrop-blur-sm shadow-sm">
            <h2 className="text-xs md:text-sm font-sans tracking-[0.2em] uppercase mb-1 opacity-90 animate-fadeIn font-bold">
              Discover Your Signature Scent
            </h2>
            <h1 className="text-2xl md:text-3xl font-serif font-medium mb-3 leading-tight tracking-tight">
              Niche & Boutique <br />
              <span className="italic">Sample Collections</span>
            </h1>
            <p className="text-sm md:text-base text-gray-800 mb-4 font-light leading-relaxed">
              הדרך החכמה לגלות בשמי נישה יוקרתיים.
              <br />
              הזמינו דוגמיות 2 מ״ל, 5 מ״ל או 10 מ״ל לפני רכישת בקבוק מלא.
            </p>
            <Link href="/catalog" className="inline-block border text-black border-black px-6 py-2 text-xs md:text-sm font-bold tracking-widest hover:bg-black hover:text-white transition duration-300 uppercase">
              Shop Now
            </Link>
          </div>
        </div>
      </section>

      {/* Live Stats Strip */}
      <LiveStats stats={stats} />

      {/* New Arrivals Section */}
      <section className="py-4 bg-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl tracking-[0.2em] uppercase mb-3 font-bold text-black">חדש על המדף</h2>
          <div className="w-10 h-0.5 bg-black mx-auto mb-6"></div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <Link href="/catalog" className="inline-block mt-8 mb-8 bg-black text-white px-8 py-3 rounded-full font-bold tracking-widest uppercase hover:bg-gray-800 transition shadow-md">
            צפייה בכל המוצרים
          </Link>
        </div>
      </section>

      <BrandCarousel brands={stats.allBrands} />

      {/* Free Samples Logic Visualization */}
      <section className="py-12 bg-black text-white border-t border-gray-900">
        <div className="container">
          <h2 className="text-3xl font-bold mb-2 text-center text-white">הבונוסים שלנו</h2>
          <p className="text-center text-gray-400 mb-8 max-w-2xl mx-auto">
            ככל שסכום ההזמנה גבוה יותר, כך אנחנו מפנקים יותר.
            <br />
            <span className="text-xs text-gray-500">* הדוגמיות נבחרות על ידי הצוות שלנו בהתאם למלאי ולטעם שלכם.</span>
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Tier 1 */}
            <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 text-center relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-zinc-800/50">
              <div className="text-lg font-bold text-gray-400 mb-2">בקנייה מעל 300 ₪</div>
              <div className="text-3xl font-bold mb-4 text-white">2 דוגמיות מתנה</div>
              <div className="text-sm text-gray-500">בגודל 2 מ״ל</div>
            </div>

            {/* Tier 2 */}
            <div className="bg-zinc-900 p-8 rounded-xl border-2 border-white text-center relative shadow-xl transform md:-translate-y-4 transition-all duration-300 hover:-translate-y-6 hover:shadow-2xl hover:shadow-white/20">
              <div className="absolute top-0 right-0 bg-white text-black text-xs px-3 py-1 rounded-bl-lg rounded-tr-xl font-bold">מומלץ</div>
              <div className="text-lg font-bold text-gray-300 mb-2">בקנייה מעל 500 ₪</div>
              <div className="text-3xl font-bold mb-4 text-white">4 דוגמיות מתנה</div>
              <div className="text-sm text-gray-500">בגודל 2 מ״ל</div>
            </div>

            {/* Tier 3 */}
            <div className="bg-zinc-900 p-8 rounded-xl border border-zinc-800 text-center relative overflow-hidden transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-zinc-800/50">
              <div className="text-lg font-bold text-gray-400 mb-2">בקנייה מעל 1000 ₪</div>
              <div className="text-3xl font-bold mb-4 text-white">6 דוגמיות מתנה</div>
              <div className="text-sm text-gray-500">בגודל 2 מ״ל</div>
            </div>
          </div>

          <div className="text-center mt-8">
            <Link href="/catalog" className="btn bg-white text-black hover:bg-gray-200 px-12 py-4 text-xl font-bold rounded-lg transition">
              קניתי אותי, בוא נתחיל
            </Link>
          </div>

        </div>
      </section>

      {/* Collections Grid - Moved Bottom */}
      <section className="py-12 bg-white border-t">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

            {/* Collection 1: Exclusive */}
            <Link href="/catalog?category=נדיר" className="group relative h-[400px] overflow-hidden rounded-lg">
              <Image
                src="/collection-exclusive.png"
                alt="Exclusive Fragrances"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                <span className="text-sm tracking-[0.2em] uppercase mb-2">The Most</span>
                <h3 className="text-3xl font-serif font-medium mb-4">EXCLUSIVE<br />FRAGRANCES</h3>
                <div className="w-8 h-0.5 bg-white mb-4" />
                <span className="text-xs font-bold underline decoration-1 underline-offset-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-300">
                  Shop Collection
                </span>
              </div>
            </Link>

            {/* Collection 2: Summer/Fresh */}
            <Link href="/catalog?category=קיץ" className="group relative h-[400px] overflow-hidden rounded-lg">
              <Image
                src="/collection-summer.png"
                alt="Summer Scents"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-black/30 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                <span className="text-sm tracking-[0.2em] uppercase mb-2">The Best</span>
                <h3 className="text-3xl font-serif font-medium mb-4">SUMMER<br />SCENTS</h3>
                <div className="w-8 h-0.5 bg-white mb-4" />
                <span className="text-xs font-bold underline decoration-1 underline-offset-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-300">
                  Shop Collection
                </span>
              </div>
            </Link>

            {/* Collection 3: Evening/Sexy */}
            <Link href="/catalog?category=ערב" className="group relative h-[400px] overflow-hidden rounded-lg">
              <Image
                src="/collection-datenight.png"
                alt="Evening Scents"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-110"
              />
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors" />
              <div className="absolute inset-0 flex flex-col items-center justify-center text-white text-center p-6">
                <span className="text-sm tracking-[0.2em] uppercase mb-2">Choose your favorite</span>
                <h3 className="text-3xl font-serif font-medium mb-4">DATE NIGHT<br />ESSENTIALS</h3>
                <div className="w-8 h-0.5 bg-white mb-4" />
                <span className="text-xs font-bold underline decoration-1 underline-offset-4 opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-4 group-hover:translate-y-0 duration-300">
                  Shop Collection
                </span>
              </div>
            </Link>

          </div >
        </div >
      </section >
    </div >
  );
}
