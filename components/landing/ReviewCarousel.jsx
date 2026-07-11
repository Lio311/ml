"use client";

import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Star } from "lucide-react";

const REVIEWS = [
  {
    id: 1,
    name: "Elena R.",
    content: "Absolutely mesmerizing. The notes of amber and vanilla linger all day.",
    rating: 5,
  },
  {
    id: 2,
    name: "Michael T.",
    content: "A premium fragrance that turns heads. The presentation is as good as the scent.",
    rating: 5,
  },
  {
    id: 3,
    name: "Sophie L.",
    content: "My new signature scent. It's warm, inviting, and truly unique.",
    rating: 5,
  },
];

export default function ReviewCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideRef = useRef(null);

  useEffect(() => {
    const timer = setInterval(() => {
      // Fade out
      gsap.to(slideRef.current, {
        opacity: 0,
        y: -10,
        duration: 0.4,
        onComplete: () => {
          setCurrentIndex((prev) => (prev + 1) % REVIEWS.length);
          // Fade in
          gsap.fromTo(
            slideRef.current,
            { opacity: 0, y: 10 },
            { opacity: 1, y: 0, duration: 0.4 }
          );
        },
      });
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const currentReview = REVIEWS[currentIndex];

  return (
    <div className="mt-8 border-t border-white/10 pt-6">
      <div className="flex items-center gap-1 mb-3">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-[#D4AF37] text-[#D4AF37]" />
        ))}
      </div>
      <div ref={slideRef} className="min-h-[80px]">
        <p className="text-sm text-[#888888] italic mb-2 leading-relaxed">
          "{currentReview.content}"
        </p>
        <p className="text-xs font-semibold tracking-wider text-white uppercase">
          — {currentReview.name}
        </p>
      </div>
      
      <div className="flex gap-2 mt-4">
        {REVIEWS.map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === currentIndex ? "w-6 bg-[#D4AF37]" : "w-2 bg-white/20"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
