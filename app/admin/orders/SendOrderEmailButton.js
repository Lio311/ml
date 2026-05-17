"use client";

import { useState } from 'react';
import toast from 'react-hot-toast';
import { generateFullOrderPDFDoc } from './pdfGenerator';

export default function SendOrderEmailButton({ order }) {
    const [isSending, setIsSending] = useState(false);

    const handleSendEmail = async () => {
        setIsSending(true);
        const toastId = toast.loading('מייצר PDF ושולח למייל...');
        
        try {
            // Generate PDF
            const doc = await generateFullOrderPDFDoc(order);
            // Get base64 representation of the PDF
            const pdfBase64 = doc.output('datauristring').split(',')[1];
            
            // Get customer details
            const email = order.customer_details?.email;
            const name = order.customer_details?.name || 'לקוח';
            
            if (!email) {
                throw new Error("לא נמצאה כתובת אימייל להזמנה זו");
            }

            // Send to our backend API
            const response = await fetch('/api/admin/orders/send-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    orderId: order.id,
                    email,
                    name,
                    pdfBase64
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "שגיאה בשליחת המייל");
            }

            toast.success('המייל נשלח בהצלחה!', { id: toastId });
            
        } catch (error) {
            console.error("Email send failed:", error);
            toast.error(error.message || 'שגיאה בשליחת המייל', { id: toastId });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <button 
            onClick={handleSendEmail}
            disabled={isSending}
            className="w-full md:w-auto bg-gray-900 text-white rounded-lg px-3 py-1.5 text-xs font-bold hover:bg-black transition flex items-center justify-center gap-1.5 flex-row-reverse whitespace-nowrap"
            title="שלח טופס הזמנה במייל ללקוח"
        >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
            </svg>
            <span>{isSending ? 'שולח...' : 'שלח במייל'}</span>
        </button>
    );
}
