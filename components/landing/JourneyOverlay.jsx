"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ShoppingBag, ArrowRight } from "lucide-react";

export default function JourneyOverlay() {
  const containerRef = useRef(null);
  const [phase, setPhase] = useState(0); // 0: Start, 1: Middle, 2: End

  useEffect(() => {
    const handleMouseMove = (e) => {
      const x = e.clientX / window.innerWidth;
      
      let newPhase = 0;
      if (x > 0.35 && x < 0.7) {
        newPhase = 1;
      } else if (x >= 0.7) {
        newPhase = 2;
      }

      if (newPhase !== phase) {
        setPhase(newPhase);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [phase]);

  useEffect(() => {
    // Fade animations based on phase
    const elements = containerRef.current.children;
    
    gsap.to(elements, {
      opacity: 0,
      y: 20,
      duration: 0.4,
      stagger: 0.05,
      onComplete: () => {
        // We let React update the DOM text, then animate it back in
        gsap.to(elements, {
          opacity: 1,
          y: 0,
          duration: 0.6,
          stagger: 0.1,
          ease: "power2.out"
        });
      }
    });
  }, [phase]);

  // Content for different phases of the mouse journey
  const content = [
    {
      title: "The Fields of Grasse",
      subtitle: "A JOURNEY OF SCENT",
      desc: "Move your cursor to explore. We begin where the rare midnight jasmine blooms, harvested in the silent hours to capture its purest essence.",
      cta: false
    },
    {
      title: "Ancient Resins",
      subtitle: "THE WARMTH OF AMBER",
      desc: "As the journey deepens, golden drops of Madagascar vanilla and ancient amber oils blend into an intoxicating, warm embrace.",
      cta: false
    },
    {
      title: "Aura de Minuit",
      subtitle: "L'ÉDITION LIMITÉE",
      desc: "The culmination of rare materials and masterful alchemy. Crafted for the bold, remembered by all.",
      cta: true
    }
  ];

  const currentContent = content[phase];

  return (
    <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-center px-12 md:px-32 mix-blend-difference" dir="ltr">
      <div ref={containerRef} className="max-w-2xl text-white">
        <p className="text-xs md:text-sm tracking-[0.3em] font-semibold text-white/70 mb-4">
          {currentContent.subtitle}
        </p>
        <h1 className="text-5xl md:text-7xl font-serif leading-tight mb-6" style={{ fontFamily: "'Playfair Display', serif" }}>
          {currentContent.title}
        </h1>
        <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-10 max-w-lg font-light">
          {currentContent.desc}
        </p>
        
        {currentContent.cta ? (
          <button className="pointer-events-auto bg-white text-black font-semibold py-4 px-10 rounded-full flex items-center justify-center gap-3 hover:scale-105 transition-transform duration-300">
            <ShoppingBag className="w-5 h-5" />
            Discover the Collection
          </button>
        ) : (
          <div className="flex items-center gap-4 text-white/50 animate-pulse">
            <span className="text-sm tracking-widest uppercase">Move right to continue</span>
            <ArrowRight className="w-5 h-5" />
          </div>
        )}
      </div>
      
      {/* Progress indicator */}
      <div className="absolute bottom-12 left-12 right-12 md:left-32 md:right-32 flex gap-4">
        {[0, 1, 2].map((i) => (
          <div key={i} className={`h-[1px] flex-1 transition-all duration-700 ${phase >= i ? 'bg-white' : 'bg-white/20'}`} />
        ))}
      </div>
    </div>
  );
}
