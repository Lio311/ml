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

    return (
        <div className="relative" ref={dropdownRef}>
            <div className="flex flex-col gap-2">
                <input
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="border p-2 rounded w-full bg-white text-left font-mono text-sm"
                    dir="ltr"
                    placeholder="https://open.spotify.com/track/..."
                />
                
                <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        {isLoading ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" /> : <Search className="w-4 h-4 text-gray-400" />}
                    </div>
                    <input
                        value={query}
                        onChange={handleInputChange}
                        onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                        className="border border-green-200 bg-green-50 p-2 pl-10 rounded w-full text-left outline-none focus:ring-2 focus:ring-green-300 transition-all text-sm"
                        dir="ltr"
                        placeholder="Search Spotify by track or artist name..."
                    />
                </div>
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
