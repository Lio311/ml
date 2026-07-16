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
      className="fixed z-[10000] pointer-events-auto w-full md:w-auto mx-0 md:mx-auto left-0 right-0 md:left-24 md:right-24 md:max-w-4xl bottom-0 md:bottom-8 bg-[#0a0a0a] border-t md:border border-neutral-800 shadow-2xl rounded-none md:rounded-sm p-5 md:py-4 md:px-6 text-white opacity-0 flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6"
      dir={isHebrew ? "rtl" : "ltr"}
    >
      <p className="text-[13.5px] md:text-[14px] text-center md:text-start leading-relaxed font-medium m-0 flex-1">
        {isHebrew
          ? "אנו משתמשים בקבצי קוקיז לצורך שיפור חוויית הגלישה, לצרכי שיווק והתאמת תכנים ובקרה, לקריאה נוספת אנא כנסו "
          : "We use cookies to improve your browsing experience, for marketing, personalized content, and analytics. For more information, please read our "}
        <Link
          href="/privacy"
          className="text-white font-semibold underline decoration-white hover:opacity-80 transition-opacity"
        >
          {isHebrew ? "למדיניות הפרטיות של האתר." : "Privacy Policy."}
        </Link>
      </p>

      <button
        onClick={handleAccept}
        className="w-full md:w-auto whitespace-nowrap bg-white text-black hover:bg-neutral-200 font-bold py-2 px-4 transition-colors text-[13.5px] shadow-sm rounded-sm"
      >
        {isHebrew ? "אישור וסגירה" : "Accept & Close"}
      </button>
    </div>
  );
}
