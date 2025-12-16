import { Assistant, Great_Vibes } from "next/font/google";
import { ClerkProvider } from '@clerk/nextjs';
import { heIL } from "@clerk/localizations";
import "./globals.css";
import Header from "./components/Header";
import Footer from "./components/Footer";
import AnalyticsTracker from "./components/AnalyticsTracker";
import ChatWidget from "./components/Chatbot/ChatWidget";
import AccessibilityWidget from "./components/AccessibilityWidget";

const assistant = Assistant({
  subsets: ["hebrew", "latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-assistant",
});

const greatVibes = Great_Vibes({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-great-vibes",
});

export const metadata = {
  title: "יוקרה בחתיכות קטנות",
  description: "חנות דוגמיות בשמים בקונספט קצת שונה. מגוון בשמי בוטיק, נישה ודיזיינר במחירים הוגנים",
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
        <body className={`${assistant.className} ${greatVibes.variable}`}>
          <CartProvider>
            <AnalyticsTracker />
            <Header />
            <main className="min-h-screen">
              {children}
            </main>
            <Footer />
            <ChatWidget />
            <AccessibilityWidget />
          </CartProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
