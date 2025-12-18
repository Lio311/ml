"use client";

export default function AdminFilterBar({ selectedLetter, onSelect, className = "" }) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');

    return (
        <div className={`flex flex-wrap gap-2 mb-8 justify-center md:justify-start ${className}`}>
            <button
                onClick={() => onSelect(null)}
                className={`px-3 py-1 rounded text-sm font-bold border transition h-8 flex items-center justify-center ${selectedLetter === null
                        ? 'bg-black text-white border-black'
                        : 'bg-white text-black border-gray-300 hover:border-black'
                    }`}
            >
                הכל
            </button>
            {alphabet.map(letter => (
                <button
                    key={letter}
                    onClick={() => onSelect(letter)}
                    className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold border transition ${selectedLetter === letter
                            ? 'bg-black text-white border-black'
                            : 'bg-white text-black border-gray-300 hover:border-black'
                        }`}
                >
                    {letter}
                </button>
            ))}
        </div>
    );
}
