"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useLanguage } from "../../context/LanguageContext";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { X } from "lucide-react";

export default function CookieConsent() {
  const [show, setShow] = useState(false);
  const containerRef = useRef(null);
  const { locale } = useLanguage();

  useEffect(() => {
    // Only check localStorage on the client side
    const consent = localStorage.getItem("cookieConsentAccepted");
    if (!consent) {
      setShow(true);
    }
  }, []);

  const { contextSafe } = useGSAP({ scope: containerRef });

  const handleAccept = contextSafe(() => {
    // Animate out
    gsap.to(containerRef.current, {
      y: 50,
      opacity: 0,
      duration: 0.4,
      ease: "power2.in",
      onComplete: () => {
        localStorage.setItem("cookieConsentAccepted", "true");
        setShow(false);
      },
    });
  });

  useGSAP(() => {
    if (show && containerRef.current) {
      // Animate in
      gsap.fromTo(
        containerRef.current,
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.6, ease: "power3.out", delay: 1 }
      );
    }
  }, [show]);

  if (!show) return null;

  const isHebrew = locale === "he";

  return (
    <div
      ref={containerRef}
      className="fixed z-[10000] pointer-events-auto w-[calc(100%-2rem)] md:w-auto mx-4 md:mx-auto left-0 right-0 md:left-24 md:right-24 md:max-w-4xl bottom-20 md:bottom-8 bg-[#0a0a0a] border border-neutral-800 shadow-2xl rounded-sm p-4 md:p-6 text-white opacity-0 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-8"
      dir={isHebrew ? "rtl" : "ltr"}
    >
      <p className="text-[14px] md:text-[15px] text-center md:text-start leading-relaxed font-medium flex-1 m-0">
        {isHebrew
          ? "אנו משתמשים בקבצי קוקיז לצורך שיפור חוויית הגלישה, לצרכי שיווק והתאמת תכנים ובקרה, לקריאה נוספת אנא כנסו למדיניות הפרטיות של האתר."
          : "We use cookies to improve your browsing experience, for marketing, personalized content, and analytics. For more information, please read our "}
        <br className="hidden md:block" />
        <Link
          href="/privacy"
          className="text-white font-semibold underline decoration-white hover:opacity-80 transition-opacity mt-1 md:mt-2 inline-block"
        >
          {isHebrew ? "לקריאת מדיניות" : "Privacy Policy."}
        </Link>
      </p>

      <button
        onClick={handleAccept}
        className="w-full md:w-auto min-w-[160px] whitespace-nowrap bg-white text-black hover:bg-neutral-200 font-bold py-3 px-6 transition-colors text-[15px] shadow-sm"
      >
        {isHebrew ? "אישור וסגירה" : "Accept & Close"}
      </button>
    </div>
  );
}
