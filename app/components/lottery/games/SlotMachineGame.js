
"use client";
import { useState } from 'react';

export default function SlotMachineGame({ prize, onComplete }) {
    const [spinning, setSpinning] = useState(false);
    const [finished, setFinished] = useState(false);

    const handleSpin = () => {
        setSpinning(true);
        setTimeout(() => {
            setSpinning(false);
            setFinished(true);
            setTimeout(onComplete, 2000);
        }, 2000); // 2s spin
    };

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <h3 className="text-2xl font-bold text-red-500 mb-8">מכונת המזל</h3>

            <div className="bg-gray-800 p-4 rounded-xl border-4 border-red-600 shadow-2xl flex gap-2">
                {/* 3 Slots. We assume they all land on the prize symbol for "Jackpot" feel */}
                {[0, 1, 2].map((i) => (
                    <div key={i} className="w-20 h-32 bg-white rounded overflow-hidden relative shadow-inner border border-gray-400">
                        <div className={`flex flex-col items-center transition-transform duration-1000 ease-in-out ${spinning ? 'animate-slot-spin' : ''}`} style={{ transform: finished ? 'translateY(0)' : 'translateY(-10px)' }}>
                            {/* Visual strip simulation */}
                            {finished ? (
                                <div className="h-32 flex flex-col items-center justify-center p-2">
                                    {prize.image_url ? (
                                        <img src={prize.image_url} alt="Prize" className="w-full h-full object-contain" />
                                    ) : (
                                        <span className="text-4xl">🧴</span>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4 py-2 opacity-50 blur-[1px]">
                                    {/* Spinning visual - repeating the prize image */}
                                    {[1, 2, 3, 4].map((_, idx) => (
                                        prize.image_url ? (
                                            <img key={idx} src={prize.image_url} alt="rolling" className="w-14 h-14 object-contain mx-auto filter grayscale opacity-70" />
                                        ) : (
                                            <span key={idx} className="text-4xl block">🧴</span>
                                        )
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {!spinning && !finished && (
                <button
                    onClick={handleSpin}
                    className="mt-8 bg-red-600 text-white font-bold py-3 px-8 rounded-full border-b-4 border-red-800 hover:bg-red-500 active:border-b-0 active:translate-y-1 transition-all"
                >
                    משוך בידית
                </button>
            )}

            {finished && (
                <div className="mt-6 text-center animate-bounce">
                    <p className="text-red-500 font-bold text-xl">זכיתם!</p>
                    <p className="text-white">{prize.brand} - {prize.model}</p>
                </div>
            )}

            <style jsx>{`
                @keyframes slot-spin {
                    0% { transform: translateY(0); }
                    100% { transform: translateY(-200px); }
                }
                .animate-slot-spin {
                    animation: slot-spin 0.2s linear infinite;
                }
            `}</style>
        </div>
    );
}
