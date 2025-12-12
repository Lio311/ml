"use client";

import { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';

export default function StarRating({ productId, readOnly = false }) {
    const { isSignedIn } = useUser();
    const [rating, setRating] = useState(0);
    const [hover, setHover] = useState(0);
    const [average, setAverage] = useState(0);
    const [count, setCount] = useState(0);

    useEffect(() => {
        // Fetch rating data
        fetch(`/api/reviews?productId=${productId}${isSignedIn ? '&myReview=true' : ''}`)
            .then(res => res.json())
            .then(data => {
                if (data.rating) setRating(data.rating); // My rating

                // Also get stats if separate call needed, but let's assume one call for stats
                // Actually, let's fetch stats separately or adjust API.
                // Current API fetches myReview OR average depending on param.
                // Let's fetch average always.
                fetch(`/api/reviews?productId=${productId}`)
                    .then(res2 => res2.json())
                    .then(stats => {
                        setAverage(stats.average);
                        setCount(stats.count);
                    });
            });
    }, [productId, isSignedIn]);

    const handleRating = async (newRating) => {
        if (readOnly) return;
        if (!isSignedIn) {
            alert('עליך להתחבר כדי לדרג');
            return;
        }

        setRating(newRating);

        try {
            await fetch('/api/reviews', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, rating: newRating })
            });
            // Refresh stats
            fetch(`/api/reviews?productId=${productId}`)
                .then(res => res.json())
                .then(stats => {
                    setAverage(stats.average);
                    setCount(stats.count);
                });
        } catch (e) {
            alert('שגיאה בשמירת הדירוג');
        }
    };

    return (
        <div className="flex flex-col items-start">
            <div className="flex items-center">
                {[...Array(5)].map((_, index) => {
                    const ratingValue = index + 1;
                    return (
                        <label key={index}>
                            <input
                                type="radio"
                                name="rating"
                                value={ratingValue}
                                className="hidden"
                                onClick={() => handleRating(ratingValue)}
                            />
                            <svg
                                className={`w-5 h-5 cursor-pointer transition-colors ${ratingValue <= (hover || rating) ? "text-yellow-400" : "text-gray-300"
                                    }`}
                                onMouseEnter={() => !readOnly && setHover(ratingValue)}
                                onMouseLeave={() => !readOnly && setHover(0)}
                                xmlns="http://www.w3.org/2000/svg"
                                viewBox="0 0 20 20"
                                fill="currentColor"
                            >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                        </label>
                    );
                })}
            </div>
            <div className="text-xs text-gray-500 mt-1">
                {average > 0 ? `${average} (${count} דירוגים)` : 'אין דירוגים'}
            </div>
        </div>
    );
}
