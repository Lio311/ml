"use client";
import { useState } from 'react';

export default function MemoryGame({ prize, onComplete, allImages = [] }) {
    // 9 Cards
    // State tracks which logical step we are in:
    // 0: Start
    // 1: First card revealed (Prize)
    // 2: Second card revealed (Random 1) -> mismatch -> reset
    // 3: Third card revealed (Random 2) -> mismatch -> reset
    // 4: Fourth card revealed (Prize) -> MATCH -> Win
    const [clickStep, setClickStep] = useState(0);

    // Track card states: { id: i, status: 'hidden' | 'revealed' | 'matched', content: string | null }
    // content is assigned lazily based on clickStep.
    const [cards, setCards] = useState(Array(9).fill(null).map((_, i) => ({
        id: i,
        status: 'hidden',
        content: null // 'prize', 'random1', 'random2'
    })));

    const [gameStage, setGameStage] = useState('playing'); // playing, won

    // Helper to get random image from pool
    const getRandomImage = (exclude = null) => {
        if (!allImages || allImages.length === 0) return "❓";
        let pool = allImages;
        if (exclude) {
            pool = allImages.filter(img => img !== exclude);
            if (pool.length === 0) pool = allImages; // Fallback
        }
        return pool[Math.floor(Math.random() * pool.length)];
    };

    const handleCardClick = (index) => {
        // Ignore if already revealed or animating
        if (cards[index].status !== 'hidden' || gameStage !== 'playing') return;

        // Logic based on step
        const newCards = [...cards];
        let nextStep = clickStep + 1;

        if (clickStep === 0) {
            // Click 1: Reveal Prize (Image)
            newCards[index] = { ...newCards[index], status: 'revealed', content: prize.image_url, type: 'image' };
            setClickStep(1);
            setCards(newCards);
        }
        else if (clickStep === 1) {
            // Click 2: Reveal Random (Mismatch)
            // Fix: EXCLUDE the Prize Image to avoid duplicates
            // Also exclude specifically based on card index if necessary, but prize exclusion is key.
            // Wait, we need to ensure the random image is NOT the prize image.
            const prizeImage = prize.image_url;
            newCards[index] = { ...newCards[index], status: 'revealed', content: getRandomImage(prizeImage), type: 'image' };
            setCards(newCards);
            setClickStep(2);

            // Delay and flip back
            setTimeout(() => {
                setCards(prev => prev.map((c, i) =>
                    i === index ? { ...c, status: 'hidden' } : c
                ));
            }, 1000);
        }
        else if (clickStep === 2) {
            // Click 3: Reveal Random (Mismatch) -> Flip back
            const previousRandom = cards.find(c => c.status === 'revealed' && c.type === 'image' && c.id !== index);
            const excludeContent = previousRandom ? previousRandom.content : null;
            // Fix: Exclude BOTH the previous random card AND the Prize Image
            // Implementing multi-exclusion if simple helper doesn't support it?
            // Helper `getRandomImage` takes single exclude.
            // Let's modify helper or pre-filter.

            // Inline logic for multi-exclusion:
            let pool = allImages.filter(img => img !== prize.image_url && img !== excludeContent);
            if (pool.length === 0) pool = allImages.filter(img => img !== prize.image_url); // Fallback

            const randomImg = pool[Math.floor(Math.random() * pool.length)];

            newCards[index] = { ...newCards[index], status: 'revealed', content: randomImg, type: 'image' };
            setCards(newCards);
            setClickStep(3);

            setTimeout(() => {
                setCards(prev => prev.map((c, i) =>
                    i === index ? { ...c, status: 'hidden' } : c
                ));
            }, 1000);
        }
        else if (clickStep === 3) {
            // Click 4: Reveal Prize (Match!)
            newCards[index] = { ...newCards[index], status: 'matched', content: prize.image_url, type: 'prize' };
            // Mark the first one as matched too
            const firstCardIndex = cards.findIndex(c => c.type === 'prize' || (c.type === 'image' && c.content === prize.image_url));
            // Better logic: Find the card that was revealed in step 0. It has type='image' and content=prize.image_url.
            // Wait, in step 0 I set type='image'.

            if (firstCardIndex !== -1) {
                newCards[firstCardIndex] = { ...newCards[firstCardIndex], status: 'matched', type: 'prize' };
            }

            setCards(newCards);
            setClickStep(4);

            // Trigger Win Sequence
            setTimeout(() => {
                setGameStage('won');
                // Wait a bit then finish
                setTimeout(onComplete, 3000); // Give time for the transformation animation
            }, 1000);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-4 w-full h-full min-h-[400px]">
            <h3 className="text-2xl font-bold text-red-500 mb-6">משחק הזיכרון</h3>

            {gameStage === 'playing' && (
                <div className="grid grid-cols-3 gap-4 w-full max-w-sm mx-auto">
                    {cards.map((card, i) => (
                        <div
                            key={i}
                            onClick={() => handleCardClick(i)}
                            className={`
                                relative w-full pt-[133%] cursor-pointer perspective-1000
                            `}
                        >
                            <div className={`
                                absolute inset-0 w-full h-full transition-transform duration-500 transform-style-3d
                                ${card.status === 'hidden' ? 'rotate-y-0' : 'rotate-y-180'}
                            `}>
                                {/* Front (Hidden) */}
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-br from-red-900 to-black rounded-xl border-2 border-red-500/50 flex items-center justify-center backface-hidden shadow-xl">
                                    <span className="text-4xl">❓</span>
                                </div>

                                {/* Back (Revealed) */}
                                <div className="absolute inset-0 w-full h-full bg-white rounded-xl border-2 border-red-500 flex items-center justify-center backface-hidden rotate-y-180 shadow-xl overflow-hidden p-2">
                                    <img
                                        src={card.content}
                                        alt="brand"
                                        className="w-full h-full object-contain"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {gameStage === 'won' && (
                <div className="relative w-full h-80 flex items-center justify-center animate-zoom-in">
                    {/* The Final Prize Reveal */}
                    <div className="bg-white p-8 rounded-2xl border-4 border-red-500 shadow-2xl text-center flex flex-col items-center">
                        {/* Transformation: Begins as Logo, Fades into Bottle */}
                        <div className="relative w-40 h-40 mb-4">
                            {prize.image_url ? (
                                <img
                                    src={prize.image_url}
                                    alt="prize"
                                    className="absolute inset-0 w-full h-full object-contain animate-fade-in-slow"
                                    onError={(e) => e.target.style.display = 'none'}
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center text-6xl">🧴</div>
                            )}
                        </div>

                        <p className="text-red-500 font-bold text-2xl mb-2">מצאתם!</p>
                        <p className="text-black text-xl font-bold">{prize.brand} {prize.model}</p>
                        <p className="text-gray-500">({prize.size} מ"ל)</p>
                    </div>
                </div>
            )}

            <style jsx>{`
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
                
                @keyframes fade-out-slow {
                    0% { opacity: 1; transform: scale(1); }
                    100% { opacity: 0; transform: scale(0.5); }
                }
                .animate-fade-out-slow {
                    animation: fade-out-slow 1.5s forwards 0.5s; /* Delay start */
                }
                
                @keyframes fade-in-slow {
                    0% { opacity: 0; transform: scale(0.5); }
                    100% { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in-slow {
                    animation: fade-in-slow 1.5s forwards 0.5s;
                }
            `}</style>
        </div>
    );
}
