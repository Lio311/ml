
"use client";
import { useState } from 'react';

export default function RouletteGame({ prize, onComplete, allImages = [] }) {
    const [spinning, setSpinning] = useState(false);
    const [finished, setFinished] = useState(false);

    // Prepare wheel images: 12 slices
    // Slice 0 (Top) is the Winner -> Prize
    // Others: Fill with available images
    // If no other images, repeat prize
    const wheelImages = Array(12).fill(null).map((_, i) => {
        if (i === 0) return prize.image_url;
        const pool = allImages.length > 0 ? allImages : [prize.image_url];
        return pool[i % pool.length];
    });

    const handleSpin = () => {
        setSpinning(true);
        setTimeout(() => {
            setSpinning(false);
            setFinished(true);
            setTimeout(onComplete, 2000);
        }, 3000); // 3s spin
    };

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <h3 className="text-2xl font-bold text-red-500 mb-8">סובבו את הרולטה</h3>

            <div className="relative w-80 h-80">
                {/* Wheel Container - Rotates */}
                <div
                    className={`relative w-full h-full rounded-full border-4 border-red-500 shadow-2xl overflow-hidden transition-transform duration-[3000ms] cubic-bezier(0.25, 0.1, 0.25, 1) ${spinning ? 'rotate-[1080deg]' : 'rotate-0'}`}
                >
                    {/* Background Colors (Red/Black) */}
                    <div className="absolute inset-0 w-full h-full bg-[conic-gradient(from_0deg_at_center,_red_0deg_30deg,_black_30deg_60deg,_red_60deg_90deg,_black_90deg_120deg,_red_120deg_150deg,_black_150deg_180deg,_red_180deg_210deg,_black_210deg_240deg,_red_240deg_270deg,_black_270deg_300deg,_red_300deg_330deg,_black_330deg_360deg)]"></div>

                    {/* Images Layer */}
                    {wheelImages.map((imgSrc, i) => (
                        <div
                            key={i}
                            className="absolute top-0 left-1/2 w-12 h-1/2 -ml-6 origin-bottom pt-4 flex justify-center"
                            style={{ transform: `rotate(${i * 30 + 15}deg)` }}
                        >
                            {imgSrc && (
                                <img
                                    src={imgSrc}
                                    alt="perfume"
                                    className="w-8 h-8 object-contain drop-shadow-md bg-white/20 rounded-full"
                                    style={{ transform: 'rotate(180deg)' }} // Fix orientation if needed, usually bottoms point to center
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Pointer (Top Center) */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-white z-20 drop-shadow-xl"></div>

                {/* Center / Play Button */}
                {!spinning && !finished && (
                    <button
                        onClick={handleSpin}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full flex items-center justify-center font-bold border-4 border-red-500 shadow-lg hover:scale-110 transition-transform z-20 text-black p-1"
                    >
                        SPIN
                    </button>
                )}

                {/* Result Overlay */}
                {finished && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 rounded-full animate-fade-in z-30 p-6 border-4 border-white/20">
                        {prize.image_url ? (
                            <img src={prize.image_url} alt="prize" className="w-24 h-24 object-contain mb-3 bg-white rounded-full p-2 shadow-lg" />
                        ) : (
                            <span className="text-4xl mb-2">🧴</span>
                        )}
                        <div className="text-center">
                            <p className="text-red-500 font-bold text-sm">{prize.brand}</p>
                            <p className="text-white font-bold text-lg leading-tight">{prize.model}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
