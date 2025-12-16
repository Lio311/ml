
"use client";

import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';
import LotteryGameContainer from '../components/lottery/LotteryGameContainer';

export default function LotteryPage() {
    const { startLottery } = useCart();
    const router = useRouter();
    const [budget, setBudget] = useState(500);
    const [gameState, setGameState] = useState('intro'); // intro, generating, playing, summary
    const [bundle, setBundle] = useState([]);
    const [distractorImages, setDistractorImages] = useState([]);
    const [products, setProducts] = useState([]);

    // Fetch products for lottery logic
    useEffect(() => {
        async function loadProducts() {
            try {
                // We'll reuse the main products API or similar
                // For now, let's assume we can fetch all.
                // Or maybe we need a specialized API?
                // Let's try fetching from /api/products (which exists?) 
                // Wait, typically we used server components for data fetching.
                // But this is an interactive client game.
                // I'll fetch from the catalog API or just pass data if I can.
                // For MVP speed, I'll fetch `/api/products` (if I made it? I made `/api/catalog` logic? I haven't made a pure JSON products API for client).
                // I'll use the Public Catalog logic `app/catalog/page.js` uses `getProducts`.
                // But I can't import server functions here directly easily without "use server" actions.
                // I will create a simple Server Action here to get products.
            } catch (err) {
                console.error(err);
            }
        }
        // Actually, let's define the action in a separate file or inline if Next.js allows. 
        // Better: client calls an API route. 
        // I'll fetch from `/api/lottery/products` (I need to create this) OR just use the existing data if I have it context? No.

        // Let's create `app/api/lottery/init/route.js` to get filtered products for the game.
    }, []);

    const handleBudgetChange = (e) => setBudget(Number(e.target.value));

    const generateBundle = async () => {
        setGameState('generating');
        // Call API to get bundle matching budget
        try {
            const res = await fetch('/api/lottery/generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ budget })
            });
            const data = await res.json();
            if (data.success) {
                setBundle(data.items);
                setDistractorImages(data.distractorImages || []);
                setGameState('playing');
            } else {
                alert('לא הצלחנו למצוא קומבינציה מתאימה לתקציב, נסה לשנות תקציב');
                setGameState('intro');
            }
        } catch (e) {
            console.error(e);
            setGameState('intro');
        }
    };

    const handleAllGamesFinished = () => {
        setGameState('summary');
    };

    const confirmSelection = () => {
        startLottery(bundle);
        router.push('/cart');
    };

    return (
        <div className="min-h-screen text-white flex flex-col items-center justify-start pt-4 p-4 relative overflow-x-hidden">

            {/* Background Image Logic */}

            {/* Mobile: Fixed Position Div (Solves Jitter) */}
            <div
                className="fixed inset-0 z-[-2] md:hidden bg-cover bg-center bg-no-repeat"
                style={{
                    backgroundImage: 'url(https://images.pexels.com/photos/24643920/pexels-photo-24643920/free-photo-of-interior-of-a-casino.jpeg)',
                }}
            />

            {/* Desktop: Absolute Div with bg-fixed (Parallax Effect) */}
            <div
                className="hidden md:block absolute inset-0 z-[-2] bg-cover bg-center bg-no-repeat bg-fixed h-full min-h-screen"
                style={{
                    backgroundImage: 'url(https://images.pexels.com/photos/24643920/pexels-photo-24643920/free-photo-of-interior-of-a-casino.jpeg)',
                }}
            />

            {/* Dark Overlay (Shared) */}
            <div className="fixed inset-0 z-[-1] bg-black/60" />

            <div className="relative z-10 w-full flex flex-col items-center">
                {gameState === 'intro' && (
                    <div className="max-w-3xl text-center space-y-6 animate-fade-in">
                        {/* Title Removed as per request */}
                        <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/20 shadow-2xl max-w-2xl mx-auto transform hover:scale-[1.01] transition-transform duration-300">
                            <p className="text-2xl text-white font-bold leading-relaxed drop-shadow-md">
                                אוהבים הפתעות? תנו לנו לבחור בשבילכם!<br />
                                בחרו תקציב, סובבו את הגלגל, וקבלו סט דוגמיות ייחודי ומגוון<br />
                                <span className="text-red-400 font-black mt-3 block text-3xl tracking-tight drop-shadow-sm">בהנחה מטורפת של 15% ל-10 דקות בלבד!</span>
                            </p>
                        </div>

                        <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
                            <label className="block text-2xl font-bold mb-8">
                                התקציב שלי: <span className="text-red-500">{budget} ₪</span>
                            </label>
                            <input
                                type="range"
                                min="100"
                                max="1500"
                                step="50"
                                value={budget}
                                onChange={handleBudgetChange}
                                className="w-full h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-red-600 hover:accent-red-500 transition-all"
                            />
                            <div className="flex justify-between text-gray-500 mt-2 text-sm">
                                <span>100 ₪</span>
                                <span>1500 ₪</span>
                            </div>
                        </div>

                        <button
                            onClick={generateBundle}
                            className="bg-gradient-to-r from-red-600 to-red-800 text-white text-2xl font-black py-4 px-12 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
                        >
                            זהו יום המזל שלי
                        </button>
                    </div>
                )}

                {gameState === 'generating' && (
                    <div className="text-center">
                        <div className="w-20 h-20 border-t-4 border-red-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
                        <p className="text-2xl font-bold animate-pulse">מרכיבים את החבילה המושלמת...</p>
                    </div>
                )}

                {gameState === 'playing' && (
                    <div className="flex flex-col items-center w-full">
                        <LotteryGameContainer bundle={bundle} distractorImages={distractorImages} onFinish={handleAllGamesFinished} />
                    </div>
                )}

                {gameState === 'summary' && (
                    <div className="max-w-2xl w-full text-center space-y-8 animate-fade-in-up">
                        <h2 className="text-5xl font-extrabold text-white">זה השלל שלך!</h2>
                        <div className="bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20">
                            <ul className="space-y-4">
                                {bundle.map((item, idx) => (
                                    <li key={idx} className="flex justify-between items-center text-lg border-b border-white/5 pb-2">
                                        <span className="font-bold">{item.brand} {item.model} <span className="text-sm font-normal opacity-70">({item.size} מ"ל)</span></span>
                                        <span className="text-red-300 font-bold">{item.price} ₪</span>
                                    </li>
                                ))}
                            </ul>
                            <div className="mt-8 pt-4 border-t border-white/20 flex justify-between text-2xl font-bold">
                                <span>שווי כולל:</span>
                                <span className="line-through text-gray-400 mx-2">
                                    {bundle.reduce((sum, i) => sum + Number(i.price || 0), 0)} ₪
                                </span>
                                <span className="text-green-400">
                                    {Math.round(bundle.reduce((sum, i) => sum + Number(i.price || 0), 0) * 0.85)} ₪
                                </span>
                            </div>
                            <p className="text-sm text-red-200 mt-2 font-bold">כולל 15% הנחת הגרלה!</p>
                        </div>

                        <button
                            onClick={confirmSelection}
                            className="w-full bg-green-600 hover:bg-green-700 text-white font-black text-2xl py-6 rounded-xl shadow-2xl transition-all hover:scale-105 active:scale-95"
                        >
                            הוסף לסל והפעל טיימר (10:00)
                        </button>

                        <button
                            onClick={() => setGameState('intro')}
                            className="text-gray-400 hover:text-white mt-4 underline"
                        >
                            לא אהבתי (וותר על ההנחה)
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
