'use client';

import { useEffect } from 'react';
import toast from 'react-hot-toast';

export default function ViewerGuard({ role }) {
    useEffect(() => {
        if (role !== 'viewer') return;

        const handleInteraction = (e) => {
            // Allow normal links to work so they can navigate the dashboard
            const anchor = e.target.closest('a');
            if (anchor && anchor.href && !anchor.href.includes('javascript:') && !anchor.getAttribute('role')?.includes('button')) {
                return; // let navigation happen
            }

            // Block buttons, inputs, selects, textareas, elements with role="button", and anything that looks like an action
            const actionElement = e.target.closest('button, input, select, textarea, [role="button"], [role="switch"], [role="checkbox"]');
            
            if (actionElement) {
                // Let text inputs be focused so they can be copied? If we preventDefault on mousedown/click, they can't focus.
                // We'll just prevent clicks on action elements. If they click an input, it's blocked.
                e.preventDefault();
                e.stopPropagation();
                
                // Use a single toast id to prevent spamming
                toast.error('משתמש במצב צופה בלבד - לא ניתן לבצע פעולות', { id: 'viewer-error' });
            }
        };

        const handleKeydown = (e) => {
            // Block enter and space on action elements
            if (e.key === 'Enter' || e.key === ' ') {
                const actionElement = e.target.closest('button, input, select, textarea, [role="button"]');
                if (actionElement) {
                    e.preventDefault();
                    e.stopPropagation();
                    toast.error('משתמש במצב צופה בלבד - לא ניתן לבצע פעולות', { id: 'viewer-error' });
                }
            }
        };

        const handleSubmit = (e) => {
            // Block all form submissions just in case
            e.preventDefault();
            e.stopPropagation();
            toast.error('משתמש במצב צופה בלבד - לא ניתן לבצע פעולות', { id: 'viewer-error' });
        };

        // Capture phase to intercept before React synthetic events
        document.addEventListener('click', handleInteraction, true);
        document.addEventListener('keydown', handleKeydown, true);
        document.addEventListener('submit', handleSubmit, true);

        return () => {
            document.removeEventListener('click', handleInteraction, true);
            document.removeEventListener('keydown', handleKeydown, true);
            document.removeEventListener('submit', handleSubmit, true);
        };
    }, [role]);

    return null;
}
