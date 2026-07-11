import Hero3D from "@/components/landing/Hero3D";
import ProductPanel from "@/components/landing/ProductPanel";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata = {
  title: "Aura de Minuit | Limited Edition Luxury Perfume",
  description: "Experience the intoxicating blend of warm amber, Madagascar vanilla, and rare midnight jasmine in Aura de Minuit. An ultra-premium 3D presentation.",
  openGraph: {
    title: "Aura de Minuit | Limited Edition Luxury Perfume",
    description: "Experience the intoxicating blend of warm amber, Madagascar vanilla, and rare midnight jasmine.",
    url: "https://your-domain.com/landing",
    type: "website",
    images: [
      {
        url: "https://your-domain.com/ml_v5.png", // using an existing asset from the root as a placeholder
        width: 1200,
        height: 630,
        alt: "Aura de Minuit 3D Render",
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "Aura de Minuit | Limited Edition Luxury Perfume",
    description: "An intoxicating blend of warm amber, Madagascar vanilla, and rare midnight jasmine.",
  }
};

export default function LandingPage() {
  
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": "Aura de Minuit - L'Édition Limitée",
    "image": [
      "https://your-domain.com/ml_v5.png"
    ],
    "description": "An intoxicating blend of warm amber, Madagascar vanilla, and rare midnight jasmine. Crafted for the bold, remembered by all.",
    "sku": "AURA-MINUIT-100",
    "brand": {
      "@type": "Brand",
      "name": "L'Édition Limitée"
    },
    "offers": {
      "@type": "Offer",
      "url": "https://your-domain.com/landing",
      "priceCurrency": "USD",
      "price": "245",
      "itemCondition": "https://schema.org/NewCondition",
      "availability": "https://schema.org/InStock",
      "seller": {
        "@type": "Organization",
        "name": "Luxury Perfumes Inc."
      }
    },
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "5.0",
      "reviewCount": "84"
    }
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <main className="w-screen h-screen overflow-hidden flex flex-col md:flex-row bg-[#050505]">
        {/* Left Side: 3D Scene */}
        <section className="w-full md:w-[60%] h-[50vh] md:h-screen relative">
          <Hero3D />
        </section>

        {/* Right Side: Product Panel */}
        <section className="w-full md:w-[40%] h-[50vh] md:h-screen relative z-10">
          {/* We wrap ProductPanel to pass the Playfair font variable down easily if needed, but it's applied inside the component using inline styles or generic serif classes */}
          <div className={`${playfair.className} w-full h-full`}>
            <ProductPanel />
          </div>
        </section>
      </main>
    </>
  );
}
