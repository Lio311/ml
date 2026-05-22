'use client';

import { useEffect, useRef, useCallback } from 'react';

const FONTS = [
    { label: 'ברירת מחדל', value: '' },
    { label: 'Assistant', value: 'Assistant, sans-serif' },
    { label: 'כתב יד', value: "'Gveret Levin', 'Dancing Script', cursive" },
];

const SIZES = [
    { label: 'S', value: '0.75em' },
    { label: 'M', value: '1em' },
    { label: 'L', value: '1.35em' },
    { label: 'XL', value: '1.75em' },
    { label: 'XXL', value: '2.5em' },
];

function ToolbarBtn({ title, onClick, children, active }) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={e => { e.preventDefault(); onClick(); }}
            className={`w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-all select-none
                ${active ? 'bg-gray-800 text-white' : 'hover:bg-gray-200 text-gray-700'}`}
        >
            {children}
        </button>
    );
}

export default function RichTextEditorClient({ value, onChange, dir = 'rtl' }) {
    const editorRef = useRef(null);
    const isExternalUpdateRef = useRef(false);

    // Initialize with value
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== (value || '')) {
            isExternalUpdateRef.current = true;
            editorRef.current.innerHTML = value || '';
            isExternalUpdateRef.current = false;
        }
    }, [value]);

    const execCmd = useCallback((cmd, val = null) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, val);
        triggerChange();
    }, []);

    const triggerChange = useCallback(() => {
        if (!editorRef.current || isExternalUpdateRef.current) return;
        const html = editorRef.current.innerHTML;
        onChange(html === '<br>' || html === '' ? '' : html);
    }, [onChange]);

    const applyFont = (fontFamily) => {
        editorRef.current?.focus();
        if (!fontFamily) {
            document.execCommand('removeFormat', false, null);
        } else {
            document.execCommand('fontName', false, fontFamily);
            // Wrap selection in a span with the font if execCommand didn't work well
        }
        triggerChange();
    };

    const applySize = (size) => {
        editorRef.current?.focus();
        // Use fontSize execCommand (only supports 1-7)
        // Instead, wrap in span with style
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            if (!range.collapsed) {
                const span = document.createElement('span');
                span.style.fontSize = size;
                try {
                    range.surroundContents(span);
                } catch {
                    span.appendChild(range.extractContents());
                    range.insertNode(span);
                }
                sel.removeAllRanges();
                const newRange = document.createRange();
                newRange.selectNodeContents(span);
                sel.addRange(newRange);
                triggerChange();
            }
        }
    };

    return (
        <div className="border border-gray-300 rounded-xl overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center gap-1 px-3 py-2 bg-gray-50 border-b border-gray-200 flex-wrap">
                {/* Font family */}
                <select
                    title="פונט"
                    onChange={e => applyFont(e.target.value)}
                    defaultValue=""
                    className="h-8 px-2 text-xs border border-gray-300 rounded bg-white text-gray-700 cursor-pointer"
                    onMouseDown={e => e.stopPropagation()}
                >
                    {FONTS.map(f => (
                        <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                </select>

                {/* Font size */}
                <div className="flex gap-0.5 border border-gray-300 rounded overflow-hidden">
                    {SIZES.map(s => (
                        <button
                            key={s.value}
                            type="button"
                            title={`גודל ${s.label}`}
                            onMouseDown={e => { e.preventDefault(); applySize(s.value); }}
                            className="px-2 h-8 text-xs font-bold hover:bg-gray-200 bg-white text-gray-700 transition-all select-none border-r border-gray-200 last:border-0"
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Bold / Italic / Underline */}
                <ToolbarBtn title="מודגש" onClick={() => execCmd('bold')}><b>B</b></ToolbarBtn>
                <ToolbarBtn title="נטוי" onClick={() => execCmd('italic')}><i>I</i></ToolbarBtn>
                <ToolbarBtn title="קו תחתון" onClick={() => execCmd('underline')}><u>U</u></ToolbarBtn>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Alignment */}
                <ToolbarBtn title="יישור שמאל" onClick={() => execCmd('justifyLeft')}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="1" width="14" height="2"/><rect x="0" y="5" width="10" height="2"/><rect x="0" y="9" width="14" height="2"/><rect x="0" y="13" width="8" height="2"/></svg>
                </ToolbarBtn>
                <ToolbarBtn title="יישור מרכז" onClick={() => execCmd('justifyCenter')}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="1" width="14" height="2"/><rect x="2" y="5" width="10" height="2"/><rect x="0" y="9" width="14" height="2"/><rect x="3" y="13" width="8" height="2"/></svg>
                </ToolbarBtn>
                <ToolbarBtn title="יישור ימין" onClick={() => execCmd('justifyRight')}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor"><rect x="0" y="1" width="14" height="2"/><rect x="4" y="5" width="10" height="2"/><rect x="0" y="9" width="14" height="2"/><rect x="6" y="13" width="8" height="2"/></svg>
                </ToolbarBtn>

                <div className="w-px h-6 bg-gray-300 mx-1" />

                {/* Text color */}
                <label title="צבע טקסט" className="relative w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 cursor-pointer transition-all">
                    <span className="text-sm font-bold">A</span>
                    <input
                        type="color"
                        defaultValue="#000000"
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        onInput={e => execCmd('foreColor', e.target.value)}
                    />
                    <div className="absolute bottom-0.5 left-1 right-1 h-1 rounded-sm bg-current pointer-events-none" />
                </label>

                {/* Clear formatting */}
                <ToolbarBtn title="נקה עיצוב" onClick={() => execCmd('removeFormat')}>
                    <span className="text-xs">✕</span>
                </ToolbarBtn>
            </div>

            {/* Editable area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                dir={dir}
                onInput={triggerChange}
                className="min-h-[120px] p-3 text-sm focus:outline-none bg-white leading-relaxed"
                style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }}
                data-placeholder="הקלד כאן את הטקסט..."
            />
            <style>{`
                [contenteditable]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                }
            `}</style>
        </div>
    );
}
