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
                        <g>
                            {/* Cable dropping from left edge of jib */}
                            <line x1="320" y1="90" x2="320" y2="230" stroke="#64748b" strokeWidth="2" className="animate-crane-cable" />
                            
                            {/* The block being lifted */}
                            <g className="animate-crane-block">
                                <rect x="0" y="0" width="100" height="24" rx="4" fill="#3b82f6" stroke="none" />
                                <line x1="15" y1="12" x2="85" y2="12" stroke="white" strokeWidth="2" />
                            </g>
                        </g>

                        {/* Workers */}
                        {/* Walking Worker */}
                        <g className="animate-worker-walk">
                            <circle cx="500" cy="330" r="4" fill="#64748b" />
                            <line x1="500" y1="334" x2="500" y2="344" stroke="#64748b" strokeWidth="2" />
                            <g className="animate-worker-legs">
                                <line x1="500" y1="344" x2="495" y2="350" stroke="#64748b" strokeWidth="2" />
                                <line x1="500" y1="344" x2="505" y2="350" stroke="#64748b" strokeWidth="2" />
                            </g>
                            <line x1="500" y1="336" x2="492" y2="340" stroke="#64748b" strokeWidth="2" />
                            <line x1="500" y1="336" x2="508" y2="340" stroke="#64748b" strokeWidth="2" />
                        </g>

                        {/* Hammering Worker */}
                        <g transform="translate(560, 340)">
                            <circle cx="0" cy="-10" r="4" fill="#64748b" />
                            <line x1="0" y1="-6" x2="0" y2="4" stroke="#64748b" strokeWidth="2" />
                            <line x1="0" y1="4" x2="-4" y2="10" stroke="#64748b" strokeWidth="2" />
                            <line x1="0" y1="4" x2="4" y2="10" stroke="#64748b" strokeWidth="2" />
                            <line x1="0" y1="-4" x2="-5" y2="0" stroke="#64748b" strokeWidth="2" />
                            <g className="animate-hammer">
                                <line x1="0" y1="-4" x2="8" y2="-8" stroke="#64748b" strokeWidth="2" />
                                <line x1="8" y1="-8" x2="12" y2="-12" stroke="#475569" strokeWidth="1" />
                                <rect x="10" y="-14" width="4" height="4" fill="#475569" />
                            </g>
                        </g>

                        {/* Forklift Worker */}
                        <g className="animate-forklift">
                            <rect x="0" y="325" width="30" height="20" fill="#f59e0b" rx="2" />
                            <path d="M0 325 L5 315 H30 V325" fill="#f59e0b" />
                            <circle cx="5" cy="345" r="5" fill="#1e293b" />
                            <circle cx="25" cy="345" r="5" fill="#1e293b" />
                            <rect x="30" y="320" width="4" height="25" fill="#64748b" />
                            <g className="animate-forklift-lift">
                                <rect x="30" y="335" width="20" height="3" fill="#64748b" />
                                <rect x="35" y="325" width="10" height="10" fill="#94a3b8" />
                            </g>
                            <circle cx="15" cy="323" r="3" fill="#64748b" />
                        </g>

                        {/* Jackhammer Worker */}
                        <g className="animate-jackhammer" transform="translate(640, 340)">
                            <circle cx="0" cy="-10" r="4" fill="#64748b" />
                            <line x1="0" y1="-6" x2="0" y2="4" stroke="#64748b" strokeWidth="2" />
                            <line x1="0" y1="4" x2="-4" y2="10" stroke="#64748b" strokeWidth="2" />
                            <line x1="0" y1="4" x2="4" y2="10" stroke="#64748b" strokeWidth="2" />
                            <line x1="-5" y1="-2" x2="-8" y2="2" stroke="#64748b" strokeWidth="2" />
                            <line x1="5" y1="-2" x2="-2" y2="2" stroke="#64748b" strokeWidth="2" />
                            <rect x="-10" y="2" width="6" height="2" fill="#475569" />
                            <rect x="-8" y="2" width="2" height="10" fill="#cbd5e1" />
                            <line x1="-7" y1="12" x2="-7" y2="14" stroke="#475569" strokeWidth="1" />
                        </g>

                        {/* Welding Worker (on laptop) */}
                        <g transform="translate(230, 335)">
                            <circle cx="0" cy="0" r="4" fill="#64748b" />
                            <line x1="0" y1="4" x2="0" y2="10" stroke="#64748b" strokeWidth="2" />
                            <line x1="0" y1="10" x2="4" y2="15" stroke="#64748b" strokeWidth="2" />
                            <line x1="0" y1="10" x2="-4" y2="15" stroke="#64748b" strokeWidth="2" />
                            <line x1="0" y1="6" x2="-6" y2="12" stroke="#64748b" strokeWidth="2" />
                            <rect x="-10" y="11" width="4" height="2" fill="#475569" />
                            <g className="animate-sparks">
                                <circle cx="-12" cy="13" r="1" fill="#fef08a" />
                                <circle cx="-15" cy="9" r="1" fill="#facc15" />
                                <circle cx="-9" cy="16" r="1" fill="#fb923c" />
                            </g>
                        </g>

                        {/* Painter Worker (on ladder) */}
                        <g transform="translate(447, 295)">
                            <circle cx="0" cy="0" r="4" fill="#64748b" />
                            <line x1="0" y1="4" x2="0" y2="12" stroke="#64748b" strokeWidth="2" />
                            <line x1="0" y1="12" x2="-4" y2="18" stroke="#64748b" strokeWidth="2" />
                            <line x1="0" y1="12" x2="4" y2="24" stroke="#64748b" strokeWidth="2" />
                            <line x1="0" y1="6" x2="-6" y2="10" stroke="#64748b" strokeWidth="2" />
                            <g className="animate-paint-arm">
                                <line x1="0" y1="6" x2="8" y2="-2" stroke="#64748b" strokeWidth="2" />
                                <line x1="8" y1="-2" x2="10" y2="-10" stroke="#475569" strokeWidth="1" />
                                <rect x="8" y="-12" width="4" height="2" fill="#3b82f6" />
                            </g>
                        </g>
                    </svg>
                </div>

                <div className="flex justify-center mb-6 md:mb-8">
                    <Image src="/logo_v5.png" alt="ml_tlv" width={140} height={50} className="object-contain brightness-0" />
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
                
                @keyframes crane-cable {
                    0%, 100% {
                        transform: scaleY(1);
                    }
                    50% {
                        transform: scaleY(0.4285);
                    }
                }
                .animate-crane-cable {
                    transform-origin: 320px 90px;
                    animation: crane-cable 5s ease-in-out infinite;
                }
                
                @keyframes crane-block {
                    0%, 100% {
                        transform: translate(270px, 230px) rotate(-10deg);
                    }
                    50% {
                        transform: translate(270px, 150px) rotate(-10deg);
                    }
                }
                .animate-crane-block {
                    animation: crane-block 5s ease-in-out infinite;
                }
                
                @keyframes worker-walk {
                    0%, 100% { transform: translateX(0); }
                    50% { transform: translateX(-100px); }
                }
                .animate-worker-walk {
                    animation: worker-walk 8s linear infinite;
                }
                
                @keyframes worker-legs {
                    0%, 50%, 100% { transform: scaleX(1); }
                    25%, 75% { transform: scaleX(-1); }
                }
                .animate-worker-legs {
                    transform-origin: 500px 344px;
                    animation: worker-legs 0.6s infinite alternate;
                }
                
                @keyframes hammer {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(40deg); }
                }
                .animate-hammer {
                    transform-origin: 0px -4px;
                    animation: hammer 0.5s infinite;
                }
                
                @keyframes forklift {
                    0%, 100% { transform: translateX(20px); }
                    50% { transform: translateX(120px); }
                }
                .animate-forklift {
                    animation: forklift 6s ease-in-out infinite;
                }
                @keyframes forklift-lift {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-15px); }
                }
                .animate-forklift-lift {
                    animation: forklift-lift 3s ease-in-out infinite;
                }
                
                @keyframes jackhammer {
                    0%, 100% { transform: translate(640px, 340px); }
                    50% { transform: translate(640px, 339px); }
                }
                .animate-jackhammer {
                    animation: jackhammer 0.1s infinite;
                }
                
                @keyframes sparks {
                    0%, 100% { opacity: 0; }
                    50% { opacity: 1; }
                }
                .animate-sparks circle:nth-child(1) { animation: sparks 0.2s infinite; }
                .animate-sparks circle:nth-child(2) { animation: sparks 0.3s infinite 0.1s; }
                .animate-sparks circle:nth-child(3) { animation: sparks 0.15s infinite 0.2s; }
                
                @keyframes paint-arm {
                    0%, 100% { transform: rotate(0deg); }
                    50% { transform: rotate(30deg); }
                }
                .animate-paint-arm {
                    transform-origin: 0px 6px;
                    animation: paint-arm 1.5s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
}
