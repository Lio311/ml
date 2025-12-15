"use client";
import { useState, useEffect } from 'react';

export default function ChickenShooterGame({ prize, onComplete }) {
    const [aim, setAim] = useState(50); // 0-100
    const [chickens, setChickens] = useState([
        { id: 1, pos: 20, alive: true },
        { id: 2, pos: 50, alive: true },
        { id: 3, pos: 80, alive: true }
    ]);
    const [gameStage, setGameStage] = useState('playing'); // playing, won
    const [message, setMessage] = useState('');
    const [recoil, setRecoil] = useState(false);

    const handleShoot = () => {
        setRecoil(true);
        setTimeout(() => setRecoil(false), 100);

        // Find chicken hit
        const hitChicken = chickens.find(c => c.alive && Math.abs(c.pos - aim) < 10);

        if (hitChicken) {
            setChickens(prev => prev.map(c =>
                c.id === hitChicken.id ? { ...c, alive: false } : c
            ));

            // Check win condition (1 left)
            const remaining = chickens.filter(c => c.id !== hitChicken.id && c.alive).length; // Wait, current update is async? No, logic based on current state.
            // Actually, we just found hitChicken which WAS alive. So remaining decrement by 1.
            const aliveCount = chickens.filter(c => c.alive).length - 1;

            if (aliveCount === 1) {
                // Determine the survivor (the one that wasn't hit)
                // Wait, if 3 -> hit 1 -> 2 left.
                // If 2 -> hit 1 -> 1 left. Win.
                // The survivor transforms into the prize.
                setMessage('נשאר רק אחד!');
                setTimeout(() => {
                    setGameStage('won');
                    setTimeout(onComplete, 3000);
                }, 1000);
            } else {
                setMessage('פגיעה בול! נשאר עוד אחד...');
            }
        } else {
            setMessage('פספסת! נסה שוב');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 w-full max-w-md mx-auto">
            <h3 className="text-2xl font-bold text-red-500 mb-4">צייד המזל</h3>

            <div className="relative w-full h-64 bg-gray-800 rounded-xl border-4 border-gray-700 overflow-hidden mb-6 shadow-2xl">
                {/* Scene Background */}
                <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')]"></div>

                {/* Chickens */}
                {gameStage === 'playing' && chickens.map((chicken) => (
                    <div
                        key={chicken.id}
                        className={`absolute bottom-4 transition-all duration-300 transform -translate-x-1/2 text-5xl cursor-target
                            ${!chicken.alive ? 'scale-0 opacity-0 rotate-180' : 'animate-bounce-slow'}
                        `}
                        style={{ left: `${chicken.pos}%` }}
                    >
                        🐔
                        {/* Explosion effect if just died? Simplified for now */}
                    </div>
                ))}

                {/* Prize Reveal (Survivor turns into prize) */}
                {gameStage === 'won' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center animate-zoom-in">
                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20 shadow-lg text-center">
                            <p className="text-red-500 font-bold text-xl mb-2">ברכות!</p>
                            {prize.image_url ? (
                                <img src={prize.image_url} alt="prize" className="w-32 h-32 object-contain mx-auto mb-2 bg-white rounded-full p-2" />
                            ) : (
                                <span className="text-6xl block mb-2">🧴</span>
                            )}
                            <p className="text-white font-bold">{prize.brand} {prize.model}</p>
                            <p className="text-sm text-gray-300">({prize.size} מ"ל)</p>
                        </div>
                    </div>
                )}

                {/* Crosshair */}
                {gameStage === 'playing' && (
                    <div
                        className={`absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-75 text-4xl -translate-x-1/2 ${recoil ? '-mt-2' : ''}`}
                        style={{ left: `${aim}%`, color: 'red' }}
                    >
                        🎯
                    </div>
                )}
            </div>

            {/* Controls */}
            {gameStage === 'playing' && (
                <div className="w-full space-y-6">
                    <p className="text-center text-white h-6">{message || "כוון ופגע ב-2 תרנגולות!"}</p>

                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={aim}
                        onChange={(e) => setAim(Number(e.target.value))}
                        className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-500"
                    />

                    <button
                        onClick={handleShoot}
                        className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-full text-xl shadow-lg active:scale-95 transition-transform"
                    >
                        אש! 🔥
                    </button>
                </div>
            )}

            <style jsx>{`
                @keyframes bounce-slow {
                    0%, 100% { transform: translateY(0) translateX(-50%); }
                    50% { transform: translateY(-10px) translateX(-50%); }
                }
                .animate-bounce-slow {
                    animation: bounce-slow 2s infinite;
                }
                .animate-zoom-in {
                    animation: zoom-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                }
                @keyframes zoom-in {
                    0% { transform: scale(0); opacity: 0; }
                    100% { transform: scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
