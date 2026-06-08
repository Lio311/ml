'use client';

import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';
import Link from 'next/link';

export default function Error({ error, reset }) {
    useEffect(() => {
        // Log the error to Sentry
        Sentry.captureException(error);
        console.error("Global Error Caught:", error);
    }, [error]);

    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center px-4 text-center" dir="rtl">
            <h1 className="text-6xl mb-4">🙊</h1>
            <h2 className="text-2xl font-bold mb-4">אופס! משהו השתבש...</h2>
            <p className="text-gray-600 mb-8 max-w-md">
                קרתה שגיאה לא צפויה. הצוות שלנו קיבל דיווח על כך והנושא בטיפול.
            </p>
            <div className="flex gap-4">
                <button
                    onClick={() => reset()}
                    className="px-6 py-3 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition"
                >
                    נסה שוב
                </button>
                <Link 
                    href="/"
                    className="px-6 py-3 border border-black font-bold rounded-full hover:bg-gray-50 transition"
                >
                    חזרה לעמוד הבית
                </Link>
            </div>
        </div>
    );
}
