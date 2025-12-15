
"use client";
import { useState } from 'react';

export default function RouletteGame({ prize, onComplete }) {
    const [spinning, setSpinning] = useState(false);
    const [finished, setFinished] = useState(false);

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

            <div className="relative w-64 h-64">
                {/* Wheel */}
                <div
                    className={`w-full h-full rounded-full border-4 border-red-500 bg-[conic-gradient(at_center,_red_0deg_30deg,_black_30deg_60deg,_red_60deg_90deg,_black_90deg_120deg,_red_120deg_150deg,_black_150deg_180deg,_red_180deg_210deg,_black_210deg_240deg,_red_240deg_270deg,_black_270deg_300deg,_red_300deg_330deg,_black_330deg_360deg)] shadow-2xl transition-transform duration-[3000ms] cubic-bezier(0.25, 0.1, 0.25, 1) ${spinning ? 'rotate-[1080deg]' : 'rotate-0'}`}
                ></div>

                {/* Pointer */}
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[20px] border-t-white z-10 drop-shadow-md"></div>

                {/* Center / Play Button */}
                {!spinning && !finished && (
                    <button
                        onClick={handleSpin}
                        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-white rounded-full flex items-center justify-center font-bold border-4 border-red-500 shadow-lg hover:scale-110 transition-transform z-20 text-black"
                    >
                        SPIN
                    </button>
                )}

                {/* Result Overlay */}
                {finished && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 rounded-full animate-fade-in z-30">
                        <span className="text-4xl mb-2">🧴</span>
                        <div className="text-center">
                            <p className="text-red-400 font-bold text-sm">{prize.brand}</p>
                            <p className="text-white font-bold text-lg">{prize.model}</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
