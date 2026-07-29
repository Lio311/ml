import { getBrand } from "./lib/brand";

export default async function manifest() {
  const brand = await getBrand();
  
  return {
    name: brand.fullTitle || "ml_tlv - יוקרה בחתיכות קטנות",
    short_name: brand.name || "ml_tlv",
    description: "חנות דוגמיות בשמים בקונספט קצת שונה. מגוון בשמי בוטיק, נישה ודיזיינר במחירים הוגנים",
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#000000",
    theme_color: "#000000",
    dir: "rtl",
    lang: "he",
    categories: ["shopping", "lifestyle"],
    icons: [
      {
        src: "/api/assets/logo?type=icon_192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/api/assets/logo?type=icon_512",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/api/assets/logo?type=icon_192",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/api/assets/logo?type=icon_512",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ],
    screenshots: [],
    prefer_related_applications: false
  };
}
