'use client';

import { useEffect, useRef } from 'react';

export default function RichTextEditorClient({ value, onChange, dir = 'rtl' }) {
    const editorRef = useRef(null);
    const quillRef = useRef(null);
    const isUpdatingRef = useRef(false);

    useEffect(() => {
        if (quillRef.current || !editorRef.current) return;

        const initQuill = async () => {
            const Quill = (await import('quill')).default;

            // Register custom fonts
            const Font = Quill.import('formats/font');
            Font.whitelist = ['assistant', 'handwriting'];
            Quill.register(Font, true);

            const quill = new Quill(editorRef.current, {
                theme: 'snow',
                modules: {
                    toolbar: [
                        [{ font: ['', 'assistant', 'handwriting'] }],
                        [{ size: ['small', false, 'large', 'huge'] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ color: [] }, { background: [] }],
                        [{ align: [] }],
                        ['clean'],
                    ],
                },
            });

            if (value) {
                quill.root.innerHTML = value;
            }

            quill.on('text-change', () => {
                if (isUpdatingRef.current) return;
                const html = quill.root.innerHTML;
                onChange(html === '<p><br></p>' ? '' : html);
            });

            quillRef.current = quill;
        };

        initQuill();
    }, []);

    // Sync external value changes (language tab switch)
    useEffect(() => {
        if (!quillRef.current) return;
        const current = quillRef.current.root.innerHTML;
        const incoming = value || '';
        if (current !== incoming) {
            isUpdatingRef.current = true;
            quillRef.current.root.innerHTML = incoming;
            isUpdatingRef.current = false;
        }
    }, [value]);

    return (
        <>
            <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css" />
            <style>{`
                .ql-toolbar.ql-snow { border-radius: 8px 8px 0 0; border-color: #e5e7eb; background: #f9fafb; }
                .ql-container.ql-snow { border-radius: 0 0 8px 8px; border-color: #e5e7eb; min-height: 120px; font-size: 14px; }
                .ql-editor { min-height: 100px; direction: ${dir}; text-align: ${dir === 'rtl' ? 'right' : 'left'}; }
                .ql-font-assistant { font-family: var(--font-assistant, 'Assistant'), sans-serif; }
                .ql-font-handwriting { font-family: 'Gveret Levin', 'Dancing Script', cursive; }
                .ql-picker.ql-font .ql-picker-label[data-value='assistant']::before,
                .ql-picker.ql-font .ql-picker-item[data-value='assistant']::before { content: 'Assistant'; font-family: 'Assistant', sans-serif; }
                .ql-picker.ql-font .ql-picker-label[data-value='handwriting']::before,
                .ql-picker.ql-font .ql-picker-item[data-value='handwriting']::before { content: 'כתב יד'; font-family: 'Gveret Levin', cursive; }
            `}</style>
            <div ref={editorRef} />
        </>
    );
}
