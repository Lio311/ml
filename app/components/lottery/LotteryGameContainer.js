
"use client";

import { useState, useEffect } from 'react';
import ShellGame from './games/ShellGame';
import RouletteGame from './games/RouletteGame';
import SlotMachineGame from './games/SlotMachineGame';
import ChickenShooterGame from './games/ChickenShooterGame';
import TruthOrDareGame from './games/TruthOrDareGame';
import SpeedGame from './games/SpeedGame';
import MemoryGame from './games/MemoryGame';

export default function LotteryGameContainer({ bundle, onFinish }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [gameStage, setGameStage] = useState('playing'); // playing, revealed (waiting for next)

    const currentPrize = bundle[currentIndex];

    // 7 Games Available
    const [currentGameType, setCurrentGameType] = useState(Math.floor(Math.random() * 7));

    // Update random game when index changes, ensuring no repeats
    useEffect(() => {
        setCurrentGameType(prev => {
            let next;
            do {
                next = Math.floor(Math.random() * 7);
            } while (next === prev); // Ensure variety
            return next;
        });
    }, [currentIndex]);

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
                <h2 className="text-4xl font-bold text-white mb-4">כל הכבוד! שמור בתיק:</h2>
                <div className="bg-gray-800 p-6 rounded-xl border border-gray-700 mb-8 w-full">
                    <p className="text-xl text-gray-300">עד כה השגת:</p>
                    <ul className="text-left mt-4 space-y-2">
                        {bundle.slice(0, currentIndex + 1).map((item, idx) => (
                            <li key={idx} className="flex items-center gap-2 border-b border-gray-700 pb-2 last:border-0">
                                <span className="text-green-500">✔</span>
                                <span className="font-bold text-white">{item.brand}</span>
                                <span className="text-gray-400">{item.model} ({item.size} מ"ל)</span>
                            </li>
                        ))}
                    </ul>
                </div>
                <button
                    onClick={nextGame}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold text-2xl py-4 px-12 rounded-full shadow-lg transition-transform hover:scale-105"
                >
                    לבושם הבא
                </button>
            </div>
        );
    }

    return (
        <div className="bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border border-gray-800 max-w-2xl w-full">
            <div className="bg-gradient-to-r from-gray-800 to-gray-900 p-4 border-b border-gray-700 flex justify-between items-center">
                <span className="text-red-500 font-bold">פריט {currentIndex + 1} מתוך {bundle.length}</span>
                <div className="flex gap-1">
                    {bundle.map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full ${i < currentIndex ? 'bg-green-500' : i === currentIndex ? 'bg-red-500 animate-pulse' : 'bg-gray-700'}`}></div>
                    ))}
                </div>
            </div>

            <div className="min-h-[400px] flex items-center justify-center">
                {currentGameType === 0 && <ShellGame prize={currentPrize} onComplete={handleGameComplete} />}
                {currentGameType === 1 && <RouletteGame prize={currentPrize} allImages={bundle.map(i => i.image_url).filter(Boolean)} onComplete={handleGameComplete} />}
                {currentGameType === 2 && <SlotMachineGame prize={currentPrize} allImages={bundle.map(i => i.image_url).filter(Boolean)} onComplete={handleGameComplete} />}
                {currentGameType === 3 && <ChickenShooterGame prize={currentPrize} onComplete={handleGameComplete} />}
                {currentGameType === 4 && <TruthOrDareGame prize={currentPrize} allImages={bundle.map(i => i.image_url).filter(Boolean)} onComplete={handleGameComplete} />}
                {currentGameType === 5 && <SpeedGame prize={currentPrize} allImages={bundle.map(i => i.image_url).filter(Boolean)} onComplete={handleGameComplete} />}
                {currentGameType === 6 && <MemoryGame prize={currentPrize} allImages={bundle.map(i => i.image_url).filter(Boolean)} onComplete={handleGameComplete} />}
            </div>
        </div>
    );
}
