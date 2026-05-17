"use client";

import { useState } from 'react';
import toast from 'react-hot-toast';
import { generateFullOrderPDFDoc } from './pdfGenerator';

export default function DownloadFullOrderPDF({ order }) {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            const doc = await generateFullOrderPDFDoc(order);
            doc.save(`order-${order.id}-full-details.pdf`);
            toast.success('הזמנה הופקה בהצלחה!');
        } catch (error) {
            console.error("PDF generation failed:", error);
            toast.error('שגיאה ביצירת ה-PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button 
            onClick={handleDownload}
            disabled={isGenerating}
            className="w-full md:w-auto bg-blue-600 text-white rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-blue-700 transition flex items-center justify-center gap-1.5 flex-row-reverse whitespace-nowrap"
            title="הורד פירוט מלא של ההזמנה ל-PDF"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m.75 12 3 3m0 0 3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
            </svg>
            <span>{isGenerating ? 'מייצר...' : 'הורד הזמנה'}</span>
        </button>
    );
}
