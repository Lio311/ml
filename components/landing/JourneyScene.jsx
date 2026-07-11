"use client";

import { useEffect, useState } from "react";

export default function JourneyScene() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const handleMouseMove = (e) => {
      // In RTL, we start the journey on the right side of the screen
      const x = e.clientX / window.innerWidth;
      
      let newPhase = 0;
      if (x <= 0.35) {
        newPhase = 2; // Left side
      } else if (x <= 0.7) {
        newPhase = 1; // Middle
      } else {
        newPhase = 0; // Right side
      }

      if (newPhase !== phase) {
        setPhase(newPhase);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [phase]);

  return (
    <div className="absolute inset-0 z-0 bg-black pointer-events-auto overflow-hidden">
      {/* Video 1 - Right Side (Phase 0) */}
      <video
        src="/perfume1.mp4"
        autoPlay
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${phase === 0 ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
        style={{ transitionProperty: 'opacity, transform', transitionDuration: '1.5s' }}
      />
      
      {/* Video 2 - Middle (Phase 1) */}
      <video
        src="/perfume2.mp4"
        autoPlay
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${phase === 1 ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
        style={{ transitionProperty: 'opacity, transform', transitionDuration: '1.5s' }}
      />
      
      {/* Video 3 - Left Side (Phase 2) */}
      <video
        src="/perfume3.mp4"
        autoPlay
        loop
        muted
        playsInline
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ease-in-out ${phase === 2 ? 'opacity-100 scale-105' : 'opacity-0 scale-100'}`}
        style={{ transitionProperty: 'opacity, transform', transitionDuration: '1.5s' }}
      />

      {/* Premium Cinematic Overlay - Ensures text is always readable and adds drama */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-black/80 pointer-events-none" />
      <div className="absolute inset-0 bg-black/20 pointer-events-none mix-blend-multiply" />
    </div>
  );
}
