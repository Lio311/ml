'use client';

import React, { useMemo } from 'react';
import ReactQuill, { Quill } from 'react-quill';
import 'react-quill/dist/quill.snow.css';

// Register custom fonts
const Font = Quill.import('formats/font');
Font.whitelist = ['sans-serif', 'assistant', 'handwriting', 'serif'];
Quill.register(Font, true);

export default function RichTextEditorClient({ value, onChange, placeholder = 'הכנס טקסט כאן...' }) {
    const modules = useMemo(() => ({
        toolbar: [
            [{ 'font': Font.whitelist }],
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }, { 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }, { 'align': [] }],
            ['link', 'clean']
        ],
    }), []);

    const formats = [
        'font', 'header',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'script',
        'list', 'bullet', 'indent',
        'direction', 'align',
        'link'
    ];

    return (
        <div className="bg-white text-black quill-wrapper dir-ltr">
            <style jsx global>{`
                .quill-wrapper .ql-editor {
                    min-height: 150px;
                    font-size: 16px;
                    font-family: inherit;
                }
                .quill-wrapper .ql-picker-options {
                    z-index: 50 !important;
                }
                /* Font mapping for Quill dropdown and editor */
                .ql-font-assistant { font-family: var(--font-assistant), sans-serif; }
                .ql-font-handwriting { font-family: var(--font-handwriting), cursive; font-size: 1.5em; }
                
                /* Adjust dropdown labels */
                .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="assistant"]::before,
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="assistant"]::before {
                    content: 'Assistant';
                    font-family: var(--font-assistant), sans-serif;
                }
                .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="handwriting"]::before,
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="handwriting"]::before {
                    content: 'כתב יד';
                    font-family: var(--font-handwriting), cursive;
                }
                .ql-snow .ql-picker.ql-font .ql-picker-label[data-value="sans-serif"]::before,
                .ql-snow .ql-picker.ql-font .ql-picker-item[data-value="sans-serif"]::before {
                    content: 'רגיל';
                }
            `}</style>
            <ReactQuill 
                theme="snow" 
                value={value || ''} 
                onChange={onChange} 
                modules={modules}
                formats={formats}
                placeholder={placeholder}
            />
        </div>
    );
}
