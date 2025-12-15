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

    // Helper to get random brand name that is NOT the prize
    const getRandomBrand = () => {
        // Mock brands if we only have the prize item?
        // We can use generic names or other brands if available in bundle?
        // Let's just say "Chanel", "Dior", "Versace" etc if we don't have a list.
        // Or "Try Again" / "Miss".
        // User said "Logo of a brand from the lottery pool".
        // Realistically we assume other brands exist.
        const distractions = ['Chanel', 'Dior', 'Creed', 'Tom Ford', 'Versace', 'YSL', 'Armani', 'Gucci'];
        const valid = distractions.filter(d => d !== prize.brand);
        return valid[Math.floor(Math.random() * valid.length)];
    };

    const handleCardClick = (index) => {
        // Ignore if already revealed or animating
        if (cards[index].status !== 'hidden' || gameStage !== 'playing') return;

        // Logic based on step
        const newCards = [...cards];
        let nextStep = clickStep + 1;

        if (clickStep === 0) {
            // Click 1: Reveal Prize
            newCards[index] = { ...newCards[index], status: 'revealed', content: prize.brand, type: 'prize' };
            setClickStep(1);
            setCards(newCards);
        }
        else if (clickStep === 1) {
            // Click 2: Reveal Random (Mismatch)
            // Wait, logic says "Flip back".
            newCards[index] = { ...newCards[index], status: 'revealed', content: getRandomBrand(), type: 'random' };
            setCards(newCards);
            setClickStep(2);

            // Delay and flip back ONLY the random one? Or both?
            // "Cycle repeats". Usually memory games flip both if mismatch.
            // But Card 1 is the reference. Let's keep Card 1 open?
            // User: "Card 1... Card 2 random... Card flips back". Singular.
            // So Card 2 flips back. Card 1 stays.
            setTimeout(() => {
                setCards(prev => prev.map((c, i) =>
                    i === index ? { ...c, status: 'hidden' } : c
                ));
            }, 1000);
        }
        else if (clickStep === 2) {
            // Click 3: Reveal Random (Mismatch) -> Flip back
            newCards[index] = { ...newCards[index], status: 'revealed', content: getRandomBrand(), type: 'random' };
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
            newCards[index] = { ...newCards[index], status: 'matched', content: prize.brand, type: 'prize' };
            // Mark the first one as matched too
            const firstCardIndex = cards.findIndex(c => c.type === 'prize'); // Find the one revealed in step 0
            if (firstCardIndex !== -1) {
                newCards[firstCardIndex] = { ...newCards[firstCardIndex], status: 'matched' };
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
                                <div className="absolute inset-0 w-full h-full bg-white rounded-xl border-2 border-red-500 flex items-center justify-center backface-hidden rotate-y-180 shadow-xl overflow-hidden p-2 text-center">
                                    <span className="text-gray-900 font-bold text-sm break-words leading-tight">
                                        {card.content}
                                    </span>
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
                            <div className="absolute inset-0 flex items-center justify-center animate-fade-out-slow">
                                <h2 className="text-4xl font-black text-black drop-shadow-lg">{prize.brand}</h2>
                            </div>
                            <img
                                src={prize.image_url}
                                alt="prize"
                                className="absolute inset-0 w-full h-full object-contain animate-fade-in-slow"
                            />
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
