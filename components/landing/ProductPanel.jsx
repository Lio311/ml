"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import ReviewCarousel from "./ReviewCarousel";
import { ShoppingBag } from "lucide-react";

export default function ProductPanel() {
  const panelRef = useRef(null);
  const buttonRef = useRef(null);

  useEffect(() => {
    // Initial entrance animation
    gsap.fromTo(
      panelRef.current.children,
      { y: 30, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 0.8,
        stagger: 0.15,
        ease: "power3.out",
        delay: 0.5,
      }
    );

    // Button hover animation setup
    const btn = buttonRef.current;
    
    const onEnter = () => {
      gsap.to(btn, { scale: 1.02, duration: 0.3, ease: "power2.out" });
    };
    
    const onLeave = () => {
      gsap.to(btn, { scale: 1, duration: 0.3, ease: "power2.out" });
    };

    btn.addEventListener("mouseenter", onEnter);
    btn.addEventListener("mouseleave", onLeave);

    return () => {
      btn.removeEventListener("mouseenter", onEnter);
      btn.removeEventListener("mouseleave", onLeave);
    };
  }, []);

  return (
    <div className="w-full h-full flex flex-col justify-center px-12 md:px-24">
      <div
        ref={panelRef}
        className="max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-[0_8px_32px_0_rgba(0,0,0,0.36)] relative overflow-hidden"
      >
        {/* Subtle glass reflection highlight */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-50 pointer-events-none" />

        <div className="relative z-10">
          <p className="text-[#D4AF37] uppercase tracking-[0.2em] text-xs font-semibold mb-3">
            L'Édition Limitée
          </p>
          
          <h1 className="text-4xl md:text-5xl font-serif text-white leading-tight mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Aura de
            <br />
            <span className="italic text-white/90">Minuit</span>
          </h1>
          
          <p className="text-[#888888] text-sm leading-relaxed mb-8">
            An intoxicating blend of warm amber, Madagascar vanilla, and rare midnight jasmine. Crafted for the bold, remembered by all.
          </p>

          <div className="flex items-end gap-4 mb-8">
            <span className="text-3xl text-white font-light tracking-tight">
              $245
            </span>
            <span className="text-[#888888] text-sm pb-1">/ 100ml</span>
          </div>

          <button
            ref={buttonRef}
            className="w-full bg-[#D4AF37] text-[#050505] font-semibold py-4 px-8 rounded-full flex items-center justify-center gap-2 hover:bg-[#ebd074] transition-colors"
          >
            <ShoppingBag className="w-5 h-5" />
            Add to Collection
          </button>

          <ReviewCarousel />
        </div>
      </div>
    </div>
  );
}
