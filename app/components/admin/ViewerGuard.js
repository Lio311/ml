'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ViewerGuard({ role }) {
    useEffect(() => {
        if (role !== 'viewer') return;

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
            document.removeEventListener('submit', handleSubmit, true);
            window.fetch = originalFetch;
            XMLHttpRequest.prototype.open = originalXhrOpen;
            XMLHttpRequest.prototype.send = originalXhrSend;
        };
    }, [role]);

    return null;
}
