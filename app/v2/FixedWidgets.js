"use client";

export default function FixedWidgets() {
    return (
        <>
            {/* Accessibility Widget (Bottom Left) */}
            <div className="fixed bottom-6 left-6 z-50">
                <button className="glass-dark w-12 h-12 rounded-full flex items-center justify-center hover:scale-110 transition-all border border-white/20 shadow-2xl backdrop-blur-3xl">
                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </button>
            </div>

            {/* Chat Widget (Bottom Right) */}
            <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
                <div className="glass-dark px-4 py-2 rounded-2xl flex items-center gap-2 border border-white/20 shadow-2xl backdrop-blur-3xl animate-pulse-slow">
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.8)]"></div>
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">6 צ'אטים כרגע</span>
                </div>
                
                <button className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/30 shadow-2xl hover:scale-110 transition-all relative group">
                    <img 
                        src="/profile-placeholder.png" 
                        alt="Chat" 
                        className="w-full h-full object-cover" 
                        onError={(e) => e.target.src = "https://api.dicebear.com/7.x/avataaars/svg?seed=Lior"}
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                    
                    {/* Status Indicator */}
                    <div className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-black"></div>
                </button>
            </div>

            <style jsx>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.9; transform: translateY(0); }
                    50% { opacity: 1; transform: translateY(-3px); }
                }
                .animate-pulse-slow {
                    animation: pulse-slow 4s ease-in-out infinite;
                }
            `}</style>
        </>
    );
}
