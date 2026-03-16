"use client";

export default function AdminFilterBar({ selectedLetter, onSelect, className = "" }) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

    return (
        <div className={`flex flex-nowrap gap-1 mb-6 md:justify-center overflow-x-auto scrollbar-hide pb-2 ${className}`}>
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
                className={`px-2 py-1 rounded-lg text-xs font-bold border transition shrink-0 shadow-sm ${(!selectedLetter || selectedLetter === '')
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
                    className={`w-7 h-7 flex items-center justify-center rounded-lg text-[11px] font-bold border transition shrink-0 shadow-sm ${selectedLetter === letter
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
