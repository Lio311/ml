
"use client";

import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useRouter } from 'next/navigation';

export default function LotteryPage() {
    const { startLottery } = useCart();
    const router = useRouter();
    const [budget, setBudget] = useState(500);
    const [gameState, setGameState] = useState('intro'); // intro, generating, playing, summary
    const [bundle, setBundle] = useState([]);
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

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
            {gameState === 'intro' && (
                <div className="max-w-2xl text-center space-y-8 animate-fade-in">
                    <h1 className="text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600">
                        הגרלת הבשמים הגדולה 🎰
                    </h1>
                    <p className="text-xl text-gray-300 leading-relaxed">
                        אוהבים הפתעות? תנו לנו לבחור בשבילכם!<br />
                        בחרו תקציב, סובבו את הגלגל, וקבלו סט דוגמיות ייחודי ומגוון<br />
                        <span className="text-yellow-400 font-bold">בהנחה מטורפת של 15% ל-10 דקות בלבד!</span>
                    </p>

                    <div className="bg-gray-900 p-8 rounded-2xl border border-gray-800 shadow-2xl">
                        <label className="block text-2xl font-bold mb-8">
                            התקציב שלי: <span className="text-yellow-400">{budget} ₪</span>
                        </label>
                        <input
                            type="range"
                            min="200"
                            max="1000"
                            step="50"
                            value={budget}
                            onChange={handleBudgetChange}
                            className="w-full h-4 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-yellow-500 hover:accent-yellow-400 transition-all"
                        />
                        <div className="flex justify-between text-gray-500 mt-2 text-sm">
                            <span>200 ₪</span>
                            <span>1000 ₪</span>
                        </div>
                    </div>

                    <button
                        onClick={generateBundle}
                        className="bg-gradient-to-r from-yellow-500 to-yellow-700 text-black text-2xl font-black py-4 px-12 rounded-full shadow-lg hover:scale-105 active:scale-95 transition-transform"
                    >
                        סובב את הגלגל! 🎲
                    </button>
                </div>
            )}

            {gameState === 'generating' && (
                <div className="text-center">
                    <div className="w-20 h-20 border-t-4 border-yellow-500 border-solid rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-2xl font-bold animate-pulse">מרכיבים את החבילה המושלמת...</p>
                </div>
            )}

            {gameState === 'playing' && (
                <div className="text-center">
                    {/* Placeholder for Game Container */}
                    <h2 className="text-4xl text-yellow-400 mb-8">Games would be here</h2>
                    <ul>
                        {bundle.map((item, idx) => (
                            <li key={idx}>{item.name} - {item.price}₪</li>
                        ))}
                    </ul>
                    <button onClick={() => {
                        startLottery(bundle);
                        router.push('/cart');
                    }}>Simulate Finish</button>
                </div>
            )}
        </div>
    );
}
