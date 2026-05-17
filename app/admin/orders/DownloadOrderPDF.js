"use client";

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

export default function DownloadOrderPDF({ order }) {
    const [isGenerating, setIsGenerating] = useState(false);

    // Helper to convert ArrayBuffer to Base64 in browser
    const arrayBufferToBase64 = (buffer) => {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    };

    // Helper to fix BiDi (Right-to-Left) text for simple jsPDF without bidi plugins
    const fixBidi = (str) => {
        if (!str) return '';
        let reversed = str.split('').reverse().join('');
        const ltrRegex = /[A-Za-z0-9@.\-_#+/,()]+(?:[\s\u00A0]+[A-Za-z0-9@.\-_#+/,()]+)*/g;
        return reversed.replace(ltrRegex, match => match.split('').reverse().join(''));
    };

    const handleDownload = async () => {
        setIsGenerating(true);
        try {
            // Fetch font from public directory
            const fontUrl = '/fonts/Narkiss Block Regular.ttf';
            const response = await fetch(fontUrl);
            if (!response.ok) {
                throw new Error("Failed to load font. Check font path.");
            }
            const fontBuffer = await response.arrayBuffer();
            const base64String = arrayBufferToBase64(fontBuffer);
            
            // Create PDF (Landscape, Millimeters, 80x20mm as requested for 8x2cm labels)
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [80, 20]
            });
            
            doc.addFileToVFS('Narkiss.ttf', base64String);
            doc.addFont('Narkiss.ttf', 'Narkiss', 'normal');
            doc.setFont('Narkiss');
            
            let isFirstPage = true;

            let items = order.items;
            if (typeof items === 'string') {
                try {
                    items = JSON.parse(items);
                } catch (e) {
                    items = [];
                }
            }

            if (!items || !Array.isArray(items)) {
                toast.error('שגיאה בקריאת פריטי ההזמנה');
                setIsGenerating(false);
                return;
            }

            items.forEach(item => {
                const qty = parseInt(item.quantity) || 1;
                
                // Fallbacks: If we have brand/model we map them, otherwise split the name.
                let rawBrand = item.brand_he || item.brand || '';
                let rawModel = item.model_he || item.model || '';
                
                if (!rawBrand && !rawModel) {
                    // Try to split name intelligently or just put Name on top line
                    rawBrand = item.name_he || item.name || '';
                    rawModel = '';
                }

                const line1 = fixBidi(rawBrand);
                const line2 = fixBidi(rawModel);
                
                for (let i = 0; i < qty; i++) {
                    // Only add a new page if it's not the very first page of the document
                    if (!isFirstPage) {
                        doc.addPage([80, 20], 'landscape');
                    }
                    isFirstPage = false;
                    
                    // Render Line 1 (Brand)
                    doc.setFontSize(14);
                    doc.text(line1, 40, 8, { align: 'center' }); // X: 40 is center of 80mm
                    
                    // Render Line 2 (Model)
                    if (line2) {
                        doc.setFontSize(12);
                        doc.text(line2, 40, 15, { align: 'center' });
                    }
                }
            });

            if (isFirstPage) {
                toast.error('הזמנה ריקה, אין מה להדפיס.');
                setIsGenerating(false);
                return;
            }

            doc.save(`order-${order.id}-labels.pdf`);
            toast.success('מדבקות הופקו בהצלחה!');
            
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
            className="w-full md:w-auto bg-gray-800 text-white rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-black transition flex items-center justify-center gap-1.5 flex-row-reverse whitespace-nowrap"
            title="הורד מדבקות PDF לכל מוצרי ההזמנה"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 12 12 16.5m0 0 4.5-4.5M12 16.5V3" />
            </svg>
            <span>{isGenerating ? 'מייצר...' : 'הורד מדבקות'}</span>
        </button>
    );
}
