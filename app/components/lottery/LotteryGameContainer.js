
"use client";

import { useState } from 'react';
import ShellGame from './games/ShellGame';
import RouletteGame from './games/RouletteGame';
import SlotMachineGame from './games/SlotMachineGame';

export default function LotteryGameContainer({ bundle, onFinish }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [gameStage, setGameStage] = useState('playing'); // playing, revealed (waiting for next)

    const currentPrize = bundle[currentIndex];

    // Cycle games: 0=Shell, 1=Roulette, 2=Slots
    const gameType = currentIndex % 3;

    const handleGameComplete = () => {
        if (currentIndex < bundle.length - 1) {
            setGameStage('revealed');
        } else {
            onFinish();
        }
    };

    const nextGame = () => {
        setCurrentIndex(prev => prev + 1);
        setGameStage('playing');
    };

    if (gameStage === 'revealed') {
        return (
            <div className="flex flex-col items-center justify-center p-8 animate-fade-in text-center">
                <h2 className="text-4xl font-bold text-green-400 mb-4">כל הכבוד! שמור בתיק! 🎒</h2>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8">
                    <p className="text-xl text-gray-300">עד כה השגת:</p>
                    <ul className="text-left mt-4 space-y-2">
                        {bundle.slice(0, currentIndex + 1).map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                                <span>✅</span>
                                <span className="font-bold">{item.brand}</span>
                                <span>{item.model}</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <button
                    onClick={nextGame}
                    className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold text-2xl py-4 px-12 rounded-full shadow-lg transition-transform hover:scale-105"
                >
                    לבושם הבא! 👉
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-800 max-w-2xl w-full">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
                <span className="text-yellow-500 font-bold">פריט {currentIndex + 1} מתוך {bundle.length}</span>
                <div className="flex gap-1">
                    {bundle.map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full ${i < currentIndex ? 'bg-green-500' : i === currentIndex ? 'bg-yellow-500 animate-pulse' : 'bg-gray-700'}`}></div>
                    ))}
                </div>
            </div>

            <div className="min-h-[400px] flex items-center justify-center">
                {gameType === 0 && <ShellGame prize={currentPrize} onComplete={handleGameComplete} />}
                {gameType === 1 && <RouletteGame prize={currentPrize} onComplete={handleGameComplete} />}
                {gameType === 2 && <SlotMachineGame prize={currentPrize} onComplete={handleGameComplete} />}
            </div>
        </div>
    );
}
