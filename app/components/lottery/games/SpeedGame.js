"use client";
import { useState, useEffect, useRef } from 'react';
import Image from '../../CImage';

export default function SpeedGame({ prize, onComplete, allImages = [] }) {
    const [running, setRunning] = useState(true);
    const [currentImg, setCurrentImg] = useState(null);
    const [finished, setFinished] = useState(false);
    const intervalRef = useRef(null);

    // Prepare pool
    const pool = allImages.length > 0 ? allImages : [prize.image_url];
    // Ensure prize is in pool? It likely is if allImages comes from bundle.

    useEffect(() => {
        if (running) {
            intervalRef.current = setInterval(() => {
                const random = pool[Math.floor(Math.random() * pool.length)];
                setCurrentImg(random);
            }, 80); // 80ms speed
        } else {
            clearInterval(intervalRef.current);
        }
        return () => clearInterval(intervalRef.current);
    }, [running, pool]);

    const handleStop = () => {
        setRunning(false);
        // Force land on prize
        setCurrentImg(prize.image_url);
        setFinished(true);
        setTimeout(onComplete, 2000);
    };

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <h3 className="text-2xl font-bold text-red-500 mb-8">משחק המהירות</h3>

            <div className="relative inline-block bg-white rounded-2xl border-4 border-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] p-4 mb-8">
                <div className="w-40 h-40 flex items-center justify-center overflow-hidden relative">
                    {currentImg ? (
                        <Image
                            src={currentImg}
                            alt="item"
                            fill
                            sizes="160px"
                            className={`object-contain transition-transform duration-75 ${running ? 'scale-90 blur-[1px]' : 'scale-110 blur-none'}`}
                        />
                    ) : (
                        <span className="text-6xl animate-pulse">🧴</span>
                    )}
                </div>

                {/* Speed Lines or Overlay */}
                {running && (
                    <div className="absolute inset-0 bg-gradient-to-t from-transparent via-white/5 to-transparent animate-scan pointer-events-none"></div>
                )}
            </div>

            {!finished ? (
                <button
                    onClick={handleStop}
                    className="bg-red-600 hover:bg-red-700 text-white font-black text-3xl py-6 px-16 rounded-full shadow-2xl transform hover:scale-105 active:scale-95 border-b-8 border-red-900 transition-all uppercase tracking-widest"
                >
                    עצור!
                </button>
            ) : (
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 animate-fade-in-up text-center w-full max-w-sm">
                    <p className="text-red-500 font-bold text-xl mb-1">תזמון מושלם!</p>
                    <p className="text-white font-bold text-lg">{prize.brand} {prize.model} ({prize.size} מ"ל)</p>
                </div>
            )}
        </div>
    );
}
