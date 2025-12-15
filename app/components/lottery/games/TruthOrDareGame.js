"use client";
import { useState, useRef, useEffect } from 'react';

export default function TruthOrDareGame({ prize, onComplete, allImages = [] }) {
    const [spinning, setSpinning] = useState(false);
    const [rotation, setRotation] = useState(0);
    const [finished, setFinished] = useState(false);

    // Setup circle items
    // We place 8 items in a circle.
    // One of them is the Prize (index 0 for simplicity, at Top).
    // Others are from allImages.
    const items = Array(8).fill(null).map((_, i) => {
        if (i === 0) return { img: prize.image_url, isPrize: true };
        const pool = allImages.length > 0 ? allImages : [prize.image_url];
        return { img: pool[i % pool.length], isPrize: false };
    });

    const handleSpin = () => {
        setSpinning(true);

        // Random rotations + landing on top (Angle 0 or 360)
        // Bottle usually points UP at 0deg in CSS?
        // Let's assume the image I generated points UP.
        // If index 0 is at Top (12 o'clock), we need to stop at 0deg (or 360*N).
        // Let's add some "slop" or just perfect aim. Perfect is fine.
        const spins = 5; // minimum full spins
        const targetDeg = spins * 360;

        setRotation(targetDeg);

        setTimeout(() => {
            setSpinning(false);
            setFinished(true);
            setTimeout(onComplete, 2000);
        }, 3000);
    };

    return (
        <div className="flex flex-col items-center justify-center p-8">
            <h3 className="text-2xl font-bold text-red-500 mb-12">אמת או חובה?</h3>

            <div className="relative w-80 h-80">
                {/* Circular Items */}
                {items.map((item, i) => {
                    // Position calculations
                    // 0 deg is Top? In CSS, sin/cos usually 0 is Right.
                    // -90 is Top.
                    const angle = (i * 360) / 8; // 0, 45, 90...
                    const rad = (angle - 90) * (Math.PI / 180);
                    const radius = 140; // px
                    const x = Math.cos(rad) * radius;
                    const y = Math.sin(rad) * radius;

                    return (
                        <div
                            key={i}
                            className={`absolute w-16 h-16 rounded-full border-2 bg-gray-800 flex items-center justify-center shadow-lg transition-transform
                                ${finished && item.isPrize ? 'scale-125 border-green-500 shadow-[0_0_15px_lime]' : 'border-gray-600'}
                            `}
                            style={{
                                left: `calc(50% + ${x}px)`,
                                top: `calc(50% + ${y}px)`,
                                transform: 'translate(-50%, -50%)'
                            }}
                        >
                            {item.img ? (
                                <img src={item.img} alt="item" className="w-10 h-10 object-contain" />
                            ) : (
                                <span className="text-xl">item</span>
                            )}
                        </div>
                    );
                })}

                {/* Bottle Spinner */}
                <div
                    className="absolute top-1/2 left-1/2 w-48 h-48 -translate-x-1/2 -translate-y-1/2 z-10 flex items-center justify-center pointer-events-none"
                    style={{
                        transform: `translate(-50%, -50%) rotate(${rotation}deg)`,
                        transition: spinning ? 'transform 3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none'
                    }}
                >
                    {/* Use the generated artifact image if available, else emoji or fallback */}
                    {/* Assuming absolute path to the uploaded/generated asset in production? 
                        I cannot depend on local C:\ path in production code really, but for this session I use what I have.
                        Actually, I should use the one I generated: glass_perfume_bottle_top_down.
                        But I don't have a URL for it hosted.
                        I'll use a generic "🍾" for MVP or try to use `prize.image_url` but that's confusing.
                        I will use a Bottle Emoji or valid SVG. 
                        User wants "Bottle starts spinning".
                        A simple css bottle shape or emoji `🍾` rotated is safest.
                    */}
                    <div className="text-8xl filter drop-shadow-2xl rotate-45 transform origin-center">
                        🍾
                    </div>
                </div>

                {/* CTA Button (Center? No center is bottle) */}
                {/* Place button below */}
            </div>

            {!spinning && !finished && (
                <button
                    onClick={handleSpin}
                    className="mt-16 bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-8 rounded-full shadow-lg text-xl"
                >
                    סובב את הבקבוק
                </button>
            )}

            {finished && (
                <div className="mt-16 bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20 animate-fade-in-up text-center">
                    <p className="text-red-500 font-bold text-xl mb-1">הבקבוק בחר!</p>
                    <p className="text-white font-bold text-lg">{prize.brand} {prize.model} ({prize.size} מ"ל)</p>
                </div>
            )}
        </div>
    );
}
