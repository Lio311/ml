"use client";

export default function AdminFilterBar({ selectedLetter, onSelect, className = "" }) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

    return (
        <div className={`flex gap-2 mb-8 overflow-x-auto pb-4 md:pb-2 scrollbar-hide md:justify-center ${className}`}>
            <style jsx>{`
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
            <button
                onClick={() => onSelect(null)}
                className={`px-4 py-1.5 rounded-lg text-sm font-bold border transition shrink-0 shadow-sm ${(!selectedLetter || selectedLetter === '')
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-gray-200 hover:border-black'
                    }`}
            >
                הכל
            </button>
            {alphabet.map(letter => (
                <button
                    key={letter}
                    onClick={() => onSelect(letter)}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-bold border transition shrink-0 shadow-sm ${selectedLetter === letter
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-black border-gray-200 hover:border-black'
                        }`}
                >
                    {letter}
                </button>
            ))}
        </div>
    );
}
