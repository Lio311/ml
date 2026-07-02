"use client";

import Image from "next/image";

export default function MaintenancePage() {
    return (
        <div className="min-h-screen w-full bg-white text-gray-900 flex flex-col items-center justify-center p-4 font-sans selection:bg-blue-100 selection:text-blue-900 overflow-hidden">
            <div className="max-w-4xl w-full text-center flex flex-col items-center animate-fade-in-up">
                
                {/* SVG Illustration Container */}
                <div className="w-full max-w-2xl relative mb-8 md:mb-12">
                    <svg viewBox="0 0 800 450" className="w-full h-auto" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        
                        {/* Background City Skyline */}
                        <path d="M50 350 V200 H120 V150 H180 V280 H250 V180 H320 V350" stroke="none" fill="#f1f5f9" />
                        <path d="M480 350 V180 H550 V220 H620 V150 H680 V350" stroke="none" fill="#f1f5f9" />
                        
                        {/* Clouds */}
                        <path d="M180 120 Q190 100 210 100 Q230 100 230 120 Q250 120 250 140 L160 140 Q160 120 180 120 Z" stroke="#cbd5e1" strokeWidth="2" fill="white" />
                        <path d="M620 90 Q630 70 650 70 Q670 70 670 90 Q690 90 690 110 L600 110 Q600 90 620 90 Z" stroke="#cbd5e1" strokeWidth="2" fill="white" />

                        {/* Ground Line */}
                        <line x1="0" y1="350" x2="800" y2="350" stroke="#3b82f6" strokeWidth="3" />

                        {/* Little Trees */}
                        {/* Tree 1 */}
                        <circle cx="120" cy="325" r="15" stroke="#3b82f6" fill="white" />
                        <line x1="120" y1="340" x2="120" y2="350" stroke="#3b82f6" />
                        {/* Tree 2 */}
                        <circle cx="160" cy="330" r="10" stroke="#3b82f6" fill="white" />
                        <line x1="160" y1="340" x2="160" y2="350" stroke="#3b82f6" />
                        {/* Tree 3 */}
                        <circle cx="700" cy="325" r="15" stroke="#3b82f6" fill="white" />
                        <line x1="700" y1="340" x2="700" y2="350" stroke="#3b82f6" />
                        {/* Tree 4 */}
                        <circle cx="740" cy="330" r="10" stroke="#3b82f6" fill="white" />
                        <line x1="740" y1="340" x2="740" y2="350" stroke="#3b82f6" />

                        {/* Laptop */}
                        <rect x="230" y="180" width="280" height="160" rx="8" stroke="#3b82f6" fill="white" />
                        <rect x="240" y="190" width="260" height="140" rx="4" stroke="#bfdbfe" fill="#f8fafc" />
                        {/* Laptop Screen Content (Logo) */}
                        <image 
                            href="/logo_v5.png" 
                            x="300" 
                            y="220" 
                            width="140" 
                            height="60" 
                            preserveAspectRatio="xMidYMid meet"
                            style={{ filter: 'brightness(0) saturate(100%) invert(43%) sepia(87%) saturate(2891%) hue-rotate(204deg) brightness(101%) contrast(93%)' }}
                        />
                        {/* Laptop Base */}
                        <path d="M200 350 L220 340 H520 L540 350 Z" stroke="#3b82f6" fill="white" />

                        {/* Tiny ladder leaning on laptop */}
                        <line x1="440" y1="340" x2="440" y2="300" stroke="#ef4444" />
                        <line x1="455" y1="340" x2="455" y2="300" stroke="#ef4444" />
                        <line x1="440" y1="330" x2="455" y2="330" stroke="#ef4444" />
                        <line x1="440" y1="320" x2="455" y2="320" stroke="#ef4444" />
                        <line x1="440" y1="310" x2="455" y2="310" stroke="#ef4444" />

                        {/* Crane Tower */}
                        <rect x="580" y="50" width="40" height="300" stroke="#3b82f6" fill="white" />
                        {Array.from({length: 10}).map((_, i) => (
                            <g key={`tower-${i}`}>
                                <line x1="580" y1={50 + i*30} x2="620" y2={80 + i*30} stroke="#3b82f6" />
                                <line x1="620" y1={50 + i*30} x2="580" y2={80 + i*30} stroke="#3b82f6" />
                                <line x1="580" y1={80 + i*30} x2="620" y2={80 + i*30} stroke="#3b82f6" />
                            </g>
                        ))}

                        {/* Crane Jib (Horizontal Arm) */}
                        <rect x="320" y="50" width="380" height="40" stroke="#3b82f6" fill="white" />
                        {Array.from({length: 9}).map((_, i) => (
                            <g key={`jib-${i}`}>
                                <line x1={320 + i*42.2} y1="50" x2={362.2 + i*42.2} y2="90" stroke="#3b82f6" />
                                <line x1={362.2 + i*42.2} y1="50" x2={320 + i*42.2} y2="90" stroke="#3b82f6" />
                                <line x1={362.2 + i*42.2} y1="50" x2={362.2 + i*42.2} y2="90" stroke="#3b82f6" />
                            </g>
                        ))}

                        {/* Counter-weight box */}
                        <rect x="700" y="50" width="60" height="40" stroke="#3b82f6" fill="white" />
                        <line x1="720" y1="50" x2="720" y2="90" stroke="#3b82f6" />
                        <line x1="740" y1="50" x2="740" y2="90" stroke="#3b82f6" />
                        
                        {/* Crane Cabin */}
                        <path d="M540 90 H580 V130 H540 A20 20 0 0 1 540 90 Z" stroke="#3b82f6" fill="white" />
                        <circle cx="560" cy="110" r="10" stroke="#3b82f6" fill="white" />
                        
                        {/* Upper cables */}
                        <line x1="600" y1="20" x2="320" y2="50" stroke="#64748b" />
                        <line x1="600" y1="20" x2="730" y2="50" stroke="#64748b" />
                        <line x1="600" y1="20" x2="600" y2="50" stroke="#3b82f6" />

                        {/* Animated Lift (Cable + Hook + Block) */}
                        <g className="animate-crane-lift">
                            {/* Cable dropping from left edge of jib */}
                            <line x1="320" y1="90" x2="320" y2="230" stroke="#64748b" strokeWidth="2" />
                            
                            {/* The block being lifted */}
                            <g transform="translate(270, 230) rotate(-10)">
                                <rect x="0" y="0" width="100" height="24" rx="4" fill="#3b82f6" stroke="none" />
                                <line x1="15" y1="12" x2="85" y2="12" stroke="white" strokeWidth="2" />
                            </g>
                        </g>
                    </svg>
                </div>



                <div className="space-y-3">
                    <h1 className="text-2xl md:text-4xl font-bold tracking-tight text-gray-800">האתר בשיפוצים</h1>
                    <p className="text-gray-500 text-sm md:text-base max-w-md mx-auto leading-relaxed px-4">
                        אנחנו עובדים על שדרוג החוויה שלכם. נחזור לאוויר בהקדם האפשרי עם דברים חדשים ומרגשים.
                    </p>
                </div>

                <div className="mt-8 md:mt-12 text-[10px] md:text-xs text-gray-400 pb-4">
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
                
                @keyframes crane-lift {
                    0% {
                        transform: translateY(0);
                    }
                    50% {
                        transform: translateY(-80px);
                    }
                    100% {
                        transform: translateY(0);
                    }
                }
                
                .animate-crane-lift {
                    animation: crane-lift 5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
