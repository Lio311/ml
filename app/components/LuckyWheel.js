"use client";

import { useState } from 'react';
import confetti from 'canvas-confetti';

const LuckyWheel = ({ onWin, onClose }) => {
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [winnerIndex, setWinnerIndex] = useState(null);

    // Prizes Configuration
    // isWinning: Determines if this prize can actually be won.
    // weight: Higher number = higher chance to win.
    const prizes = [
        { label: '5% הנחה', color: '#FFB6C1', type: 'discount', value: 0.05, isWinning: true, weight: 40 },
        { label: 'דוגמית 2 מ"ל', color: '#87CEFA', type: 'item', size: 2, name: 'דוגמית 2 מ"ל', price: 0, isWinning: true, image_url: 'https://www.dulcie.world/cdn/shop/files/DREAMLANDSAMPLESQUARE.png?v=1751633413&width=2366', weight: 40 },
        { label: 'בושם נישה מתנה', color: '#FF69B4', type: 'item', size: 'bottle', name: 'בושם נישה מתנה', price: 0, isWinning: false, weight: 0 },
        { label: 'דיסקברי סט', color: '#FFD700', type: 'item', size: 'set', name: 'דיסקברי סט', price: 0, isWinning: true, image_url: 'https://www.francescadelloro.it/images/galleries/original/Icon-yul2umy6sshp7qbpeh2t25.jpg', weight: 5 },
        { label: '25% הנחה', color: '#FF6347', type: 'discount', value: 0.25, isWinning: false, weight: 0 },
        { label: '10% הנחה', color: '#90EE90', type: 'discount', value: 0.10, isWinning: false, weight: 0 },
        { label: 'דוגמית 10 מ"ל', color: '#FFA07A', type: 'item', size: 10, name: 'דוגמית 10 מ"ל', price: 0, isWinning: true, image_url: 'https://allbottlesusa.com/cdn/shop/products/10mlClearTallBCOpen.jpg?v=1662849592&width=2048', weight: 15 },
    ];

    const spinWheel = () => {
        if (spinning) return;
        setSpinning(true);

        // Weighted Random Selection
        const winningPrizes = prizes.map((p, i) => ({ ...p, originalIndex: i })).filter(p => p.isWinning);
        const totalWeight = winningPrizes.reduce((sum, p) => sum + p.weight, 0);
        let random = Math.random() * totalWeight;
        let selectedPrize = null;

        for (const prize of winningPrizes) {
            random -= prize.weight;
            if (random <= 0) {
                selectedPrize = prize;
                break;
            }
        }

        // Fallback
        if (!selectedPrize) selectedPrize = winningPrizes[0];

        const randomWinningIndex = selectedPrize.originalIndex;

        const segmentAngle = 360 / prizes.length;

        // Calculate rotation to land on the selected winning index
        // To land on index i, the wheel must rotate such that segment i is at the "pointer" (top, 0deg).
        // Since rotation is clockwise, the target angle for segment i (which starts at i*segmentAngle) 
        // to be at 0 is: 360 - (i * segmentAngle) - (segmentAngle / 2)

        const fullSpins = 360 * (5 + Math.floor(Math.random() * 3)); // 5-7 spins
        const finalTargetAngle = 360 - (randomWinningIndex * segmentAngle) - (segmentAngle / 2);

        const totalRotation = fullSpins + finalTargetAngle;

        setRotation(totalRotation);

        setTimeout(() => {
            setSpinning(false);
            setWinnerIndex(randomWinningIndex);

            // Flashing effect
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                zIndex: 2000
            });

            // Delay before closing/updating cart (User request: "Always leave window for a few seconds" -> reduced by another 2 seconds)
            setTimeout(() => {
                onWin(prizes[randomWinningIndex]);
            }, 1000); // 1 second delay after win reveal

        }, 5000); // 5s spin duration
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center relative shadow-2xl animate-fade-in overflow-hidden">
                <h2 className="text-3xl font-bold mb-2">גלגל המזל הסודי</h2>
                <p className="mb-6 text-gray-600">כל הכבוד! העגלה שלך מעל 1,200 ₪.<br />סובבו את הגלגל וזכו בפרס שווה!</p>

                <div className="relative w-72 h-72 mx-auto mb-8">
                    {/* Wheel Container */}
                    <div
                        className="w-full h-full rounded-full border-4 border-white shadow-xl overflow-hidden transition-transform duration-[5000ms] ease-out relative"
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            background: `conic-gradient(
                                ${prizes.map((p, i) => `${p.color} ${i * (100 / prizes.length)}% ${(i + 1) * (100 / prizes.length)}%`).join(', ')}
                            )`
                        }}
                    >
                        {/* Text Overlay for Labels */}
                        {prizes.map((p, i) => {
                            const segmentAngle = 360 / prizes.length;
                            const rotationAngle = (segmentAngle * i) + (segmentAngle / 2); // Center of segment
                            return (
                                <div
                                    key={i}
                                    className="absolute w-full h-[50%] top-0 left-0 flex justify-center origin-bottom pt-4"
                                    style={{
                                        transform: `rotate(${rotationAngle}deg)`,
                                        transformOrigin: 'bottom center', // Rotate around center of wheel
                                        pointerEvents: 'none'
                                    }}
                                >
                                    {/* Text span */}
                                    <span
                                        className="text-[10px] sm:text-xs font-bold text-black whitespace-normal text-center leading-3 w-16"
                                        style={{
                                            // Radiate text:
                                            // Standard text is upright. If we rotate the container, text rotates with it.
                                            // To make text readable (top to center), we often keep it standard or rotate 180 if upside down.
                                            // The simplest for these wheels is usually standard text radiating out or in.
                                            // Let's try simple text, no special writing mode, just padded down.
                                            marginTop: '10px'
                                        }}
                                    >
                                        {p.label}
                                    </span>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pointer */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-red-600 z-10 drop-shadow-md"></div>

                    {/* Center Pin */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-md z-10"></div>
                </div>

                {/* Result Display / Button */}
                {winnerIndex !== null ? (
                    <div className="animate-pulse">
                        <h3 className="text-2xl font-bold text-green-600 mb-4">
                            זכית ב: {prizes[winnerIndex].label}! 🎁
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">מעדכן את העגלה...</p>
                    </div>
                ) : (
                    <button
                        onClick={spinWheel}
                        disabled={spinning}
                        className="btn btn-primary w-full py-4 text-xl shadow-lg transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {spinning ? 'מסובב...' : 'סובב/י את הגלגל'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default LuckyWheel;
