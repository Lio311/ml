"use client";

import { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';

const LuckyWheel = ({ onWin, onClose }) => {
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [winnerIndex, setWinnerIndex] = useState(null);

    const prizes = [
        { label: '5% הנחה', color: '#FFB6C1', type: 'discount', value: 0.05 },
        { label: 'דוגמית 2 מ"ל', color: '#87CEFA', type: 'item', size: 2, name: 'דוגמית 2 מ"ל (בחירת צוות)', price: 0 },
        { label: 'דיסקברי סט', color: '#FFD700', type: 'item', size: 'set', name: 'דיסקברי סט (מתנה)', price: 0 },
        { label: '10% הנחה', color: '#90EE90', type: 'discount', value: 0.10 },
        { label: 'דוגמית 10 מ"ל', color: '#FFA07A', type: 'item', size: 10, name: 'דוגמית 10 מ"ל (בחירת צוות)', price: 0 },
    ];

    const spinWheel = () => {
        if (spinning) return;
        setSpinning(true);

        const randomIndex = Math.floor(Math.random() * prizes.length);
        const segmentAngle = 360 / prizes.length;

        // Calculate rotation: 
        // 5-10 full spins (1800-3600 deg) + angle to land on specific segment
        // Current logic: The "pointer" is usually at the top (0 deg).
        // If we rotate the wheel clockwise, the winning segment needs to end up at the top.
        // Rotation = FullSpins + (360 - (Index * SegmentAngle)) - SegmentAngle/2 (center of segment)

        const fullSpins = 360 * (5 + Math.floor(Math.random() * 5));
        const stopAngle = 360 - (randomIndex * segmentAngle) - (segmentAngle / 2); // Center of segment at top ? 
        // Logic check: Pointer is Top. Segment 0 starts at 0?
        // Let's assume Segment 0 is 0-72 deg. Center is 36. To put 36 at top (0), we rotate -36 or 324?
        // Actually CSS rotate is usually clockwise. 
        // Let's just add random extra rotation and calculate winner based on final angle.

        const finalRotation = fullSpins + (Math.random() * 360); // Pure random? No, we want to control result? 
        // User asked for "Randomly stops". 
        // Let's control it to ensure it lands nicely in center of a wedge.

        const targetRotation = fullSpins + (360 - (randomIndex * segmentAngle)); // Land on start of segment?
        // Let's adjust to land in middle:
        const finalTarget = targetRotation - (segmentAngle / 2);

        setRotation(finalTarget);

        setTimeout(() => {
            setSpinning(false);
            setWinnerIndex(randomIndex);

            // Flashing effect then Prize logic
            setTimeout(() => {
                confetti({
                    particleCount: 150,
                    spread: 70,
                    origin: { y: 0.6 },
                    zIndex: 2000
                });
                onWin(prizes[randomIndex]);
            }, 1000); // Wait for flash effect

        }, 5000); // 5s spin
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
            <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center relative shadow-2xl animate-fade-in">
                <h2 className="text-3xl font-bold mb-2">🎉 גלגל המזל הסודי! 🎉</h2>
                <p className="mb-6 text-gray-600">כל הכבוד! העגלה שלך מעל 1,000 ₪.<br />סובב את הגלגל וזכה בפרס שווה!</p>

                <div className="relative w-64 h-64 mx-auto mb-8">
                    {/* Wheel */}
                    <div
                        className="w-full h-full rounded-full border-4 border-white shadow-lg overflow-hidden transition-transform duration-[5000ms] ease-out"
                        style={{
                            transform: `rotate(${rotation}deg)`,
                            background: `conic-gradient(
                                ${prizes.map((p, i) => `${p.color} ${i * (100 / prizes.length)}% ${(i + 1) * (100 / prizes.length)}%`).join(', ')}
                            )`
                        }}
                    >
                        {/* Lines/Text Separators could go here, but simple colored wedges work best for CSS only */}
                    </div>

                    {/* Pointer */}
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-[15px] border-l-transparent border-r-[15px] border-r-transparent border-t-[30px] border-t-red-600 z-10 drop-shadow-md"></div>
                </div>

                {/* Result Display / Button */}
                {winnerIndex !== null ? (
                    <div className="animate-pulse">
                        <h3 className="text-2xl font-bold text-green-600 mb-4">
                            זכית ב: {prizes[winnerIndex].label}! 🎁
                        </h3>
                        <p className="text-sm text-gray-500 mb-4">הפרס התווסף לעגלה בהצלחה.</p>
                        <button
                            onClick={onClose}
                            className="btn btn-primary w-full py-3 text-lg"
                        >
                            מעולה, סגור
                        </button>
                    </div>
                ) : (
                    <button
                        onClick={spinWheel}
                        disabled={spinning}
                        className="btn btn-primary w-full py-4 text-xl shadow-lg transform hover:scale-105 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {spinning ? 'מסובב...' : 'סובב את הגלגל! 🎡'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default LuckyWheel;
