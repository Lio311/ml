'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ViewerGuard({ role }) {
    useEffect(() => {
        if (role !== 'viewer') return;

        // Visual disabling of action buttons
        const disableActionElements = () => {
            const elements = document.querySelectorAll('button, input[type="submit"], [role="button"], [role="switch"]');
            
            const exactFinalTexts = [
                'שמור',
                'שמור שינויים',
                'צור מוצר',
                'הוסף קופון',
                'הוסף מונח',
                'החל שינויים',
                'כן, מחק',
                'עדכן',
                'שלח',
                'שמור מותג',
                'הוסף מותג',
                'שמור קופון',
                'שמור פרטים',
                'שמור קטגוריה',
                'שמירת פרטים',
                'שמור הגדרות'
            ];

            elements.forEach(el => {
                if (el.dataset.viewerProcessed) return;

                const text = el.textContent?.trim() || '';
                const title = el.title || '';
                
                // Only consider it a submit if explicitly marked, since DOM defaults all <button> to submit
                const isExplicitSubmit = el.getAttribute('type') === 'submit';
                
                const isExactMatch = exactFinalTexts.includes(text);
                const isSearch = text.includes('חפש') || title.includes('חפש') || el.closest('form')?.method?.toLowerCase() === 'get';
                const isSwitch = el.getAttribute('role') === 'switch';

                // Icon-only buttons (like Trash or Save)
                const isActionIcon = !text && el.querySelector('.lucide-trash, .lucide-trash-2, .lucide-save, svg path[d*="M19 21H5"]');

                if ((isExplicitSubmit || isExactMatch || isSwitch || isActionIcon) && !isSearch) {
                    el.disabled = true;
                    el.style.opacity = '0.4';
                    el.style.cursor = 'not-allowed';
                    el.title = 'משתמש במצב צופה בלבד';
                    el.dataset.viewerProcessed = 'true';
                }
            });
        };

        // Run initially
        disableActionElements();

        // Observe DOM for newly added buttons (like in modals)
        const observer = new MutationObserver((mutations) => {
            let shouldRun = false;
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    shouldRun = true;
                    break;
                }
            }
            if (shouldRun) {
                disableActionElements();
            }
        });

        observer.observe(document.body, { childList: true, subtree: true });

        // Block form submissions that are not GET
        const handleSubmit = (e) => {
            const form = e.target;
            if (form && form.method && form.method.toLowerCase() === 'get') return;
            
            e.preventDefault();
            e.stopPropagation();
            toast.error('משתמש במצב צופה בלבד - לא ניתן לבצע פעולות', { id: 'viewer-error' });
        };

        document.addEventListener('submit', handleSubmit, true);

        // Patch Fetch API
        const originalFetch = window.fetch;
        window.fetch = async function(...args) {
            const [resource, config] = args;
            const method = (config?.method || 'GET').toUpperCase();
            
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
                toast.error('משתמש במצב צופה בלבד - לא ניתן לבצע פעולות', { id: 'viewer-error' });
                return new Response(JSON.stringify({ error: "Viewer not allowed" }), { 
                    status: 403, 
                    headers: { 'Content-Type': 'application/json' } 
                });
            }
            return originalFetch.apply(this, args);
        };

        // Patch XMLHttpRequest
        const originalXhrOpen = XMLHttpRequest.prototype.open;
        XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
            if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method.toUpperCase())) {
                this._isViewerBlocked = true;
            }
            return originalXhrOpen.apply(this, arguments);
        };

        const originalXhrSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.send = function(body) {
            if (this._isViewerBlocked) {
                toast.error('משתמש במצב צופה בלבד - לא ניתן לבצע פעולות', { id: 'viewer-error' });
                setTimeout(() => {
                    Object.defineProperty(this, 'status', { value: 403 });
                    Object.defineProperty(this, 'readyState', { value: 4 });
                    if (this.onreadystatechange) this.onreadystatechange();
                    if (this.onload) this.onload();
                    if (this.onerror) this.onerror();
                }, 0);
                return;
            }
            return originalXhrSend.apply(this, arguments);
        };

        return () => {
            observer.disconnect();
            document.removeEventListener('submit', handleSubmit, true);
            window.fetch = originalFetch;
            XMLHttpRequest.prototype.open = originalXhrOpen;
            XMLHttpRequest.prototype.send = originalXhrSend;
        };
    }, [role]);

    return null;
}
