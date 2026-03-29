"use client";

import { useState } from 'react';
import { jsPDF } from 'jspdf';
import toast from 'react-hot-toast';

export default function DownloadBatchOrderPDF({ selectedOrders, onComplete }) {
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
        const hasHebrew = /[\u0590-\u05FF]/;
        if (!hasHebrew.test(str)) return str;

        const words = str.split(' ').reverse();
        const fixedWords = words.map(word => {
            if (hasHebrew.test(word)) {
                return word.split('').reverse().join('');
            }
            return word; // Keep English words as is
        });
        return fixedWords.join(' ');
    };

    const handleDownloadBatch = async () => {
        if (!selectedOrders || selectedOrders.length === 0) return;
        
        setIsGenerating(true);
        const toastId = toast.loading('מייצר קובץ מדבקות משותף...');
        
        try {
            // Fetch font from public directory
            const fontUrl = '/fonts/Narkiss Block Regular.ttf';
            const response = await fetch(fontUrl);
            if (!response.ok) {
                throw new Error("Failed to load font. Check font path.");
            }
            const fontBuffer = await response.arrayBuffer();
            const base64String = arrayBufferToBase64(fontBuffer);
            
            // Create PDF (Landscape, Millimeters, 80x20mm)
            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [80, 20]
            });
            
            doc.addFileToVFS('Narkiss.ttf', base64String);
            doc.addFont('Narkiss.ttf', 'Narkiss', 'normal');
            doc.setFont('Narkiss');
            
            let isFirstPage = true;

            selectedOrders.forEach((order) => {
                // 1. ADD COVER PAGE FOR EACH ORDER
                if (!isFirstPage) {
                    doc.addPage([80, 20], 'landscape');
                }
                isFirstPage = false;

                const orderTitle = fixBidi(`הזמנה #${order.id}`);
                const customerName = fixBidi(order.customer_details?.name || 'לקוח לא ידוע');
                
                // Draw Cover Page
                doc.setFontSize(14);
                doc.text(orderTitle, 40, 8, { align: 'center' }); 
                doc.setFontSize(12);
                doc.text(customerName, 40, 15, { align: 'center' });

                // 2. ADD ITEM LABELS
                let items = order.items;
                if (typeof items === 'string') {
                    try { items = JSON.parse(items); } catch (e) { items = []; }
                }

                if (Array.isArray(items)) {
                    items.forEach(item => {
                        const qty = parseInt(item.quantity) || 1;
                        
                        let rawBrand = item.brand_he || item.brand || '';
                        let rawModel = item.model_he || item.model || '';
                        
                        if (!rawBrand && !rawModel) {
                            rawBrand = item.name_he || item.name || '';
                            rawModel = '';
                        }

                        const line1 = fixBidi(rawBrand);
                        const line2 = fixBidi(rawModel);
                        
                        for (let i = 0; i < qty; i++) {
                            doc.addPage([80, 20], 'landscape');
                            
                            // Render Line 1 (Brand)
                            doc.setFontSize(14);
                            doc.text(line1, 40, 8, { align: 'center' }); 
                            
                            // Render Line 2 (Model)
                            if (line2) {
                                doc.setFontSize(12);
                                doc.text(line2, 40, 15, { align: 'center' });
                            }
                        }
                    });
                }
            });

            doc.save(`batch-orders-labels.pdf`);
            toast.success('המדבקות הופקו בהצלחה!', { id: toastId });
            
            if (onComplete) onComplete();
            
        } catch (error) {
            console.error("Batch PDF generation failed:", error);
            toast.error('שגיאה ביצירת ה-PDF המשותף', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <button 
            onClick={handleDownloadBatch}
            disabled={isGenerating}
            className="w-full md:w-auto bg-white border border-gray-200 shadow-sm text-gray-800 rounded-xl px-4 py-2 text-sm font-bold hover:bg-gray-50 transition flex flex-row-reverse items-center justify-center gap-2"
            title="הורד קובץ PDF עם כל המדבקות להזמנות שסומנו"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M7.5 12 12 16.5m0 0 4.5-4.5M12 16.5V3" />
            </svg>
            <span>{isGenerating ? 'מייצר...' : 'הורד הכל ל-PDF'}</span>
        </button>
    );
}
