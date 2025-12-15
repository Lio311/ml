
"use client";

import { useState, useEffect } from 'react';

export default function ShellGame({ prize, onComplete }) {
    const [gameState, setGameState] = useState('shuffle'); // shuffle, pick, reveal
    const [cups, setCups] = useState([0, 1, 2]); // positions
    const [winningCup, setWinningCup] = useState(1); // middle cup initially

    // Simple conceptual shuffle
    // We will just animate CSS classes for MVP

    useEffect(() => {
        // Auto start shuffle
        const timer = setTimeout(() => {
            setGameState('pick');
            // Randomize winning cup logic (just visually, logically any cup picks the prize for UX simplicity? 
            // Or act real? Let's make it real-ish: User always wins for this feature?)
            // "System fits the budget...". The bundle IS generated. So the user MUST win the specific item allocated.
            // So whichever cup they pick, it will contain the prize. That's the "Magic" (and easiest/safest implementation).
        }, 2000);
        return () => clearTimeout(timer);
    }, []);

    const handlePick = (idx) => {
        if (gameState !== 'pick') return;
        setGameState('reveal');
        setWinningCup(idx); // force win
        setTimeout(() => {
            onComplete();
        }, 2000); // Wait 2s to show prize then move on
    };

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <h3 className="text-2xl font-bold text-red-400 mb-8">איפה הבושם מסתתר?</h3>

            <div className="flex gap-8">
                {[0, 1, 2].map((idx) => (
                    <div
                        key={idx}
                        onClick={() => handlePick(idx)}
                        className={`
                            w-24 h-24 bg-gradient-to-b from-red-600 to-red-800 rounded-t-full shadow-xl 
                            cursor-pointer transition-all duration-500 transform
                            ${gameState === 'shuffle' ? 'animate-bounce' : ''}
                            ${gameState === 'pick' ? 'hover:-translate-y-2 hover:bg-red-500' : ''}
                            ${gameState === 'reveal' && idx === winningCup ? '-translate-y-16 opactiy-0' : ''}
                        `}
                    >
                        {/* Cup Visual */}
                        <div className="w-full h-full rounded-t-full border-b-4 border-red-900 absolute top-0 left-0"></div>

                        {/* Prize (Hidden behind cup until reveal) */}
                        {gameState === 'reveal' && idx === winningCup && (
                            <div className="absolute top-20 left-0 w-full h-foll flex flex-col items-center animate-fade-in-up">
                                <span className="text-4xl">🧴</span>
                                <span className="text-xs text-white font-bold bg-black px-2 py-1 rounded mt-2 whitespace-nowrap">{prize.model}</span>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            {gameState === 'shuffle' && <p className="mt-8 animate-pulse">מערבב...</p>}
            {gameState === 'pick' && <p className="mt-8 font-bold text-xl">בחרו כוס!</p>}
            {gameState === 'reveal' && <p className="mt-8 font-bold text-red-400 text-xl">{prize.brand} {prize.model} ({prize.size} מ"ל)!</p>}
        </div>
    );
}
