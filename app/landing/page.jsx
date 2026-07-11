import JourneyScene from "@/components/landing/JourneyScene";
import JourneyOverlay from "@/components/landing/JourneyOverlay";
import { Playfair_Display } from "next/font/google";

const playfair = Playfair_Display({ subsets: ["latin"], weight: ["400", "500", "600", "700"] });

export const metadata = {
  title: "The Perfume Journey | ml-tlv",
  description: "Take an interactive journey through fields of flowers and ancient oils. Discover the raw materials of luxury perfume.",
  openGraph: {
    title: "The Perfume Journey | ml-tlv",
    description: "Take an interactive journey through fields of flowers and ancient oils.",
    url: "https://ml-tlv.com/landing",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Perfume Journey | ml-tlv",
    description: "Take an interactive journey through fields of flowers and ancient oils.",
  }
};

export default function LandingPage() {
  const schema = {
    "@context": "https://schema.org/",
    "@type": "WebPage",
    "name": "The Perfume Journey",
    "description": "An interactive, immersive 3D journey through the raw materials of luxury perfume, featuring fields of Grasse and ancient resins.",
    "url": "https://ml-tlv.com/landing"
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      {/* 
        Strict 100vh, 100vw, no scrolling. 
        Background color is handled dynamically in JourneyScene.
      */}
      <main className={`w-screen h-screen overflow-hidden relative bg-black ${playfair.className}`}>
        <JourneyScene />
        <JourneyOverlay />
      </main>
    </>
  );
}
