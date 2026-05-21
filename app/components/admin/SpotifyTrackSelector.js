"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Loader2, Music } from "lucide-react";

export default function SpotifyTrackSelector({ value, onChange }) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const debounceRef = useRef(null);

    // Click outside to close
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchTracks = async (q) => {
        if (!q || q.length < 2) {
            setResults([]);
            return;
        }
        setIsLoading(true);
        try {
            const res = await fetch(`/api/admin/spotify-tracks?q=${encodeURIComponent(q)}`);
            if (res.ok) {
                const data = await res.json();
                setResults(data.tracks || []);
                setIsOpen(true);
            }
        } catch (e) {
            console.error("Failed to fetch tracks", e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const val = e.target.value;
        setQuery(val);
        
        // If the user pasted a direct Spotify URL, instantly select it!
        if (val.includes('open.spotify.com/track/')) {
            const cleanUrl = val.split('?')[0]; // Remove query params like ?si=...
            onChange(cleanUrl);
            setQuery("");
            setIsOpen(false);
            return;
        }
        
        if (debounceRef.current) clearTimeout(debounceRef.current);
        
        debounceRef.current = setTimeout(() => {
            fetchTracks(val);
        }, 500);
    };

    const selectTrack = (track) => {
        const url = `https://open.spotify.com/track/${track.id}`;
        onChange(url);
        setIsOpen(false);
        setQuery("");
    };
    
    // Extract ID for the iframe
    const getTrackId = (url) => {
        if (!url || !url.includes('track/')) return null;
        return url.split('track/')[1].split('?')[0];
    };
    
    const trackId = getTrackId(value);

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="flex flex-col gap-3">
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {isLoading ? <Loader2 className="w-4 h-4 text-[#1DB954] animate-spin" /> : 
                        <svg className="w-5 h-5 text-[#1DB954]" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.6.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z"/>
                        </svg>}
                    </div>
                    <input
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                        className="border-2 border-[#1DB954]/20 bg-[#1DB954]/5 p-3 pl-10 rounded-xl w-full text-left outline-none focus:border-[#1DB954] transition-all text-sm font-medium placeholder-gray-400"
                        dir="ltr"
                        placeholder="Search song, or paste a Spotify URL directly here..."
                    />
                </div>

                {trackId && !isOpen && (
                    <div className="w-full mt-2 rounded-xl overflow-hidden shadow-sm border border-gray-100">
                        <iframe 
                            src={`https://open.spotify.com/embed/track/${trackId}?utm_source=generator`} 
                            width="100%" 
                            height="152" 
                            frameBorder="0" 
                            allowFullScreen="" 
                            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                            loading="lazy"
                        ></iframe>
                    </div>
                )}
            </div>

            {isOpen && results.length > 0 && (
                <div className="absolute z-50 w-full mt-1 bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto" dir="ltr">
                    {results.map((track) => (
                        <div 
                            key={track.id} 
                            onClick={() => selectTrack(track)}
                            className="p-3 hover:bg-green-50 cursor-pointer flex items-center gap-3 border-b last:border-b-0 transition-colors"
                        >
                            <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
                                <Music className="w-4 h-4 text-gray-500" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-bold text-gray-900 truncate">{track.name}</div>
                                <div className="text-xs text-gray-500 truncate">{track.artist}</div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
