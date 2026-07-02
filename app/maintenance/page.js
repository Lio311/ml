"use client";

import { useState, useEffect } from "react";
import { Hourglass } from "lucide-react";
import Image from "next/image";

export default function MaintenancePage() {
    // Tic-Tac-Toe Game State
    const [board, setBoard] = useState(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState(true);
    const [winner, setWinner] = useState(null);

    useEffect(() => {
        calculateWinner(board);
    }, [board]);

    const calculateWinner = (squares) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                setWinner(squares[a]);
                return;
            }
        }
        if (!squares.includes(null)) {
            setWinner('draw');
        }
    };

    const handleClick = (i) => {
        if (board[i] || winner) return;
        const newBoard = [...board];
        newBoard[i] = xIsNext ? 'X' : 'O';
        setBoard(newBoard);
        setXIsNext(!xIsNext);
    };

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setXIsNext(true);
        setWinner(null);
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 font-sans selection:bg-white selection:text-black">
            <div className="max-w-2xl w-full text-center space-y-12 animate-fade-in-up">
                
                {/* Logo Area */}
                <div className="flex justify-center mb-8">
                    {/* Placeholder for Logo, using text if logo image is not found */}
                    <div className="text-4xl font-extrabold tracking-widest uppercase">
                        ML TLV
                    </div>
                </div>

                <div className="flex justify-center">
                    <Hourglass className="w-16 h-16 animate-spin text-white opacity-80" style={{ animationDuration: '3s' }} />
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl md:text-5xl font-bold tracking-tight">האתר בשיפוצים</h1>
                    <p className="text-gray-400 text-lg md:text-xl max-w-md mx-auto leading-relaxed">
                        אנחנו עובדים על שדרוג החוויה שלכם. נחזור לאוויר בהקדם האפשרי עם דברים חדשים ומרגשים.
                    </p>
                </div>

                <div className="pt-12 border-t border-gray-800">
                    <h3 className="text-gray-400 mb-6 font-medium tracking-widest text-sm uppercase">בזמן שאתם מחכים...</h3>
                    
                    <div className="inline-block bg-white/5 p-8 rounded-2xl backdrop-blur-sm border border-white/10 shadow-2xl">
                        <div className="grid grid-cols-3 gap-2 mb-6">
                            {board.map((square, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleClick(i)}
                                    className="w-20 h-20 bg-black border border-white/20 rounded-xl text-3xl font-light hover:bg-white/10 transition-colors flex items-center justify-center focus:outline-none"
                                >
                                    {square === 'X' && <span className="text-white">✕</span>}
                                    {square === 'O' && <span className="text-gray-500">◯</span>}
                                </button>
                            ))}
                        </div>

                        <div className="h-8 flex items-center justify-center">
                            {winner ? (
                                <div className="text-center">
                                    <span className="font-bold mr-4 text-lg">
                                        {winner === 'draw' ? 'תיקו!' : `המנצח: ${winner === 'X' ? '✕' : '◯'}`}
                                    </span>
                                    <button 
                                        onClick={resetGame}
                                        className="text-sm underline hover:text-gray-300 transition-colors"
                                    >
                                        משחק נוסף
                                    </button>
                                </div>
                            ) : (
                                <span className="text-gray-400">
                                    תור: {xIsNext ? '✕' : '◯'}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="mt-12 text-sm text-gray-600">
                    &copy; {new Date().getFullYear()} ML TLV. כל הזכויות שמורות.
                </div>
            </div>
            <style jsx global>{`
                @keyframes fade-in-up {
                    0% {
                        opacity: 0;
                        transform: translateY(20px);
                    }
                    100% {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }
                .animate-fade-in-up {
                    animation: fade-in-up 1s ease-out forwards;
                }
            `}</style>
        </div>
    );
}
