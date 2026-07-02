"use client";

import { useState, useEffect } from "react";
import { Hourglass } from "lucide-react";
import Image from "next/image";

export default function MaintenancePage() {
    // Tic-Tac-Toe Game State
    const [board, setBoard] = useState(Array(9).fill(null));
    const [xIsNext, setXIsNext] = useState(true);
    const [winner, setWinner] = useState(null);

    const calculateWinner = (squares) => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
            [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
            [0, 4, 8], [2, 4, 6]             // diagonals
        ];
        let hasWinner = false;
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
                setWinner(squares[a]);
                hasWinner = true;
                return squares[a];
            }
        }
        if (!squares.includes(null) && !hasWinner) {
            setWinner('draw');
            return 'draw';
        }
        return null;
    };

    useEffect(() => {
        const currentWinner = calculateWinner(board);
        
        if (!xIsNext && !currentWinner && board.includes(null)) {
            const timer = setTimeout(() => {
                makeAIMove();
            }, 600);
            return () => clearTimeout(timer);
        }
    }, [board, xIsNext]);

    const makeAIMove = () => {
        const lines = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];
        
        let move = -1;

        // 1. Try to win
        for (let i = 0; i < lines.length; i++) {
            const [a, b, c] = lines[i];
            if (board[a] === 'O' && board[b] === 'O' && !board[c]) move = c;
            else if (board[a] === 'O' && !board[b] && board[c] === 'O') move = b;
            else if (!board[a] && board[b] === 'O' && board[c] === 'O') move = a;
        }

        // 2. Block X
        if (move === -1) {
            for (let i = 0; i < lines.length; i++) {
                const [a, b, c] = lines[i];
                if (board[a] === 'X' && board[b] === 'X' && !board[c]) move = c;
                else if (board[a] === 'X' && !board[b] && board[c] === 'X') move = b;
                else if (!board[a] && board[b] === 'X' && board[c] === 'X') move = a;
            }
        }

        // 3. Take center
        if (move === -1 && !board[4]) {
            move = 4;
        }

        // 4. Random
        if (move === -1) {
            const emptyIndices = board.map((val, i) => val === null ? i : null).filter(val => val !== null);
            if (emptyIndices.length > 0) {
                move = emptyIndices[Math.floor(Math.random() * emptyIndices.length)];
            }
        }

        if (move !== -1) {
            const newBoard = [...board];
            newBoard[move] = 'O';
            setBoard(newBoard);
            setXIsNext(true);
        }
    };

    const handleClick = (i) => {
        if (board[i] || winner || !xIsNext) return;
        const newBoard = [...board];
        newBoard[i] = 'X';
        setBoard(newBoard);
        setXIsNext(false);
    };

    const resetGame = () => {
        setBoard(Array(9).fill(null));
        setXIsNext(true);
        setWinner(null);
    };

    return (
        <div className="h-screen w-full overflow-hidden bg-black text-white flex flex-col items-center justify-center p-4 font-sans selection:bg-white selection:text-black">
            <div className="max-w-2xl w-full text-center flex flex-col h-full justify-between py-2 md:py-4 animate-fade-in-up">
                
                <div className="flex-1 flex flex-col items-center justify-center space-y-4 md:space-y-6">
                    {/* Logo Area */}
                    <div className="flex justify-center">
                        <Image src="/logo_v6.png" alt="ml_tlv" width={110} height={40} className="object-contain brightness-0 invert" />
                    </div>

                    <div className="flex justify-center">
                        <Hourglass className="w-8 h-8 md:w-12 md:h-12 animate-spin text-white opacity-80" style={{ animationDuration: '3s' }} />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-2xl md:text-4xl font-bold tracking-tight">האתר בשיפוצים</h1>
                        <p className="text-gray-400 text-xs md:text-base max-w-md mx-auto leading-relaxed px-4">
                            אנחנו עובדים על שדרוג החוויה שלכם. נחזור לאוויר בהקדם האפשרי עם דברים חדשים ומרגשים.
                        </p>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-800 flex-none">
                    <h3 className="text-gray-400 mb-2 md:mb-3 font-medium tracking-widest text-[10px] md:text-xs uppercase">בזמן שאתם מחכים...</h3>
                    
                    <div className="inline-block bg-white/5 p-3 md:p-5 rounded-2xl backdrop-blur-sm border border-white/10 shadow-2xl mx-auto w-full max-w-[240px]">
                        <div className="grid grid-cols-3 gap-1.5 md:gap-2 mb-2 md:mb-4">
                            {board.map((square, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleClick(i)}
                                    className="w-10 h-10 md:w-14 md:h-14 bg-black border border-white/20 rounded-xl text-lg md:text-xl font-light hover:bg-white/10 transition-colors flex items-center justify-center focus:outline-none"
                                >
                                    {square === 'X' && <span className="text-white">✕</span>}
                                    {square === 'O' && <span className="text-gray-500">◯</span>}
                                </button>
                            ))}
                        </div>

                        <div className="h-12 flex items-center justify-center mt-1 md:mt-2">
                            {winner ? (
                                <div className="text-center flex flex-col items-center gap-1">
                                    <span className="font-bold text-base">
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
                
                <div className="mt-2 md:mt-4 text-[10px] md:text-xs text-gray-600 flex-none pb-2">
                    &copy; {new Date().getFullYear()} ml_tlv. כל הזכויות שמורות.
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
