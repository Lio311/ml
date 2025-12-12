import { Assistant } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { heIL } from "@clerk/localizations";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-assistant",
});

export const metadata = {
  title: "ml. דוגמיות יוקרה",
  description: "חנות דוגמיות בשמים הגדולה בישראל. בשמי נישה, בוטיק ועוד.",
};

import { CartProvider } from "./context/CartContext";

export default function RootLayout({ children }) {
  return (
    <ClerkProvider
      localization={heIL}
      appearance={{
        layout: {
          logoImageUrl: '/logo_v3.png',
          socialButtonsVariant: 'iconButton'
        },
        variables: {
          colorPrimary: '#000000',
        }
      }}
    >
      <html lang="he" dir="rtl">
        <body className={assistant.className}>
          <CartProvider>
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
          </CartProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
