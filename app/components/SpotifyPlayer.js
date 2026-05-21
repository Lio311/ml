'use client';

import { useState } from 'react';
import { Music, X } from 'lucide-react';

export default function SpotifyPlayer({ trackUrl }) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (!trackUrl) return null;

    // Extract track ID from URL. Example: https://open.spotify.com/track/6UelLqGlWMcVH1E5c4H7lY
    const trackIdMatch = trackUrl.match(/track\/([a-zA-Z0-9]+)/);
    if (!trackIdMatch) return null;

    const trackId = trackIdMatch[1];
    const embedUrl = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0`;

    return (
        <div className="relative group">
            {!isExpanded ? (
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsExpanded(true);
                    }}
                    className="w-10 h-10 flex items-center justify-center bg-black/80 hover:bg-black text-white rounded-full shadow-lg transition-all transform hover:scale-110"
                    title="שמע את האווירה"
                >
                    <Music size={20} className="animate-pulse" />
                </button>
            ) : (
                <div className="absolute top-0 end-0 bg-black/90 p-2 rounded-xl shadow-2xl w-[320px] md:w-[360px] animate-in fade-in zoom-in duration-200 z-50">
                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsExpanded(false);
                        }}
                        className="absolute -top-3 -end-3 bg-white text-black p-1 rounded-full shadow-md hover:bg-gray-200 transition-colors z-20"
                        title="סגור נגן"
                    >
                        <X size={16} />
                    </button>
                    <iframe
                        style={{ borderRadius: '12px' }}
                        src={embedUrl}
                        width="100%"
                        height="80"
                        frameBorder="0"
                        allowFullScreen=""
                        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                        loading="lazy"
                    ></iframe>
                </div>
            )}
        </div>
    );
}
