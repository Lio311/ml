'use client';

import { useState, useRef } from 'react';
import { Music, X, Loader2, Volume2 } from 'lucide-react';

export default function SpotifyPlayer({ trackUrl }) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [trackData, setTrackData] = useState(null);
    const [error, setError] = useState(false);
    const audioRef = useRef(null);

    if (!trackUrl) return null;

    // Extract track ID from URL. Example: https://open.spotify.com/track/6UelLqGlWMcVH1E5c4H7lY
    const trackIdMatch = trackUrl.match(/track\/([a-zA-Z0-9]+)/);
    if (!trackIdMatch) return null;
    const trackId = trackIdMatch[1];

    const handlePlayClick = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsExpanded(true);
        
        if (!trackData && !error) {
            setIsLoading(true);
            try {
                const res = await fetch(`/api/spotify-preview?trackId=${trackId}`);
                if (res.ok) {
                    const data = await res.json();
                    setTrackData(data);
                } else {
                    setError(true);
                }
            } catch (err) {
                setError(true);
            } finally {
                setIsLoading(false);
            }
        } else if (audioRef.current) {
            // Play if it was paused
            audioRef.current.play().catch(e => console.error(e));
        }
    };

    const handleClose = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setIsExpanded(false);
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
        }
    };

    const embedUrl = `https://open.spotify.com/embed/track/${trackId}?utm_source=generator&theme=0&autoplay=1`;

    return (
        <div className="relative group">
            {!isExpanded ? (
                <button
                    onClick={handlePlayClick}
                    className="w-10 h-10 flex items-center justify-center bg-black/80 hover:bg-black text-white rounded-full shadow-lg transition-all transform hover:scale-110"
                    title="שמע את האווירה"
                >
                    <Music size={20} className="animate-pulse" />
                </button>
            ) : (
                <div className="absolute top-0 end-0 bg-black/90 p-3 rounded-xl shadow-2xl w-[260px] md:w-[320px] animate-in fade-in zoom-in duration-200 z-50 text-white flex flex-col" dir="rtl">
                    <button
                        onClick={handleClose}
                        className="absolute -top-3 -end-3 bg-white text-black p-1 rounded-full shadow-md hover:bg-gray-200 transition-colors z-20"
                        title="סגור נגן"
                    >
                        <X size={16} />
                    </button>
                    
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-6">
                            <Loader2 size={24} className="animate-spin text-green-500 mb-2" />
                            <span className="text-xs text-gray-300">טוען את רגע השיא...</span>
                        </div>
                    ) : (trackData && trackData.preview_url) ? (
                        <div className="flex items-center gap-4 py-2">
                            {trackData.image && (
                                <div className="relative w-14 h-14 rounded-full overflow-hidden shrink-0 animate-[spin_4s_linear_infinite] shadow-[0_0_15px_rgba(30,215,96,0.5)] border-2 border-green-500/30">
                                    <img src={trackData.image} alt={trackData.name} className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-3 h-3 bg-black rounded-full border border-gray-700"></div>
                                    </div>
                                </div>
                            )}
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <div className="text-sm font-bold truncate" dir="ltr" style={{textAlign: 'left'}}>{trackData.name}</div>
                                <div className="text-xs text-gray-400 truncate" dir="ltr" style={{textAlign: 'left'}}>{trackData.artist}</div>
                                <div className="flex items-center justify-start gap-1 mt-1.5 text-[10px] text-green-400 font-bold" dir="ltr">
                                    <Volume2 size={12} className="animate-pulse" />
                                    <span dir="rtl">מנגן עכשיו...</span>
                                </div>
                            </div>
                            <audio 
                                ref={audioRef} 
                                src={trackData.preview_url} 
                                autoPlay 
                                controlsList="nodownload" 
                                className="hidden" 
                            />
                        </div>
                    ) : (
                        <div className="w-full mt-1">
                            <iframe
                                style={{ borderRadius: '8px' }}
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
            )}
        </div>
    );
}
