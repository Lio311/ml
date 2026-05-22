'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

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

// Normalize legacy Quill HTML to clean HTML with inline styles
function normalizeHtml(html) {
    if (!html) return '';
    return html
        .replace(/class="ql-font-assistant"/g, 'style="font-family: Assistant, sans-serif;"')
        .replace(/class="ql-font-handwriting"/g, "style=\"font-family: 'Gveret Levin', 'Dancing Script', cursive;\"")
        .replace(/class="ql-size-large"/g, 'style="font-size: 1.35em;"')
        .replace(/class="ql-size-huge"/g, 'style="font-size: 2.5em;"')
        .replace(/class="ql-size-small"/g, 'style="font-size: 0.75em;"')
        .replace(/class="ql-align-center"/g, 'style="text-align: center;"')
        .replace(/class="ql-align-left"/g, 'style="text-align: left;"')
        .replace(/class="ql-align-right"/g, 'style="text-align: right;"')
        .replace(/ class=""/g, '');
}

function ToolbarBtn({ title, onClick, children }) {
    return (
        <button
            type="button"
            title={title}
            onMouseDown={e => { e.preventDefault(); onClick(); }}
            className="w-8 h-8 flex items-center justify-center rounded text-sm font-bold transition-all select-none hover:bg-gray-200 text-gray-700"
        >
            {children}
        </button>
    );
}

export default function RichTextEditorClient({ value, onChange, dir = 'rtl' }) {
    const editorRef = useRef(null);
    const suppressRef = useRef(false);
    // Use a key to force re-mount when language tab switches (value changes dramatically)
    const prevValueRef = useRef(value);

    // On mount: set initial HTML
    useEffect(() => {
        if (editorRef.current) {
            editorRef.current.innerHTML = normalizeHtml(value || '');
            prevValueRef.current = value;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Set paragraph separator so Chrome uses <p> on Enter
    useEffect(() => {
        try { document.execCommand('defaultParagraphSeparator', false, 'p'); } catch {}
    }, []);

    const [darkEditor, setDarkEditor] = useState(false);

    // When value changes from outside (tab switch), update the editor
    useEffect(() => {
        if (!editorRef.current) return;
        if (value === prevValueRef.current) return;
        prevValueRef.current = value;
        suppressRef.current = true;
        editorRef.current.innerHTML = normalizeHtml(value || '');
        suppressRef.current = false;
    }, [value]);

    const triggerChange = useCallback(() => {
        if (!editorRef.current || suppressRef.current) return;
        const html = editorRef.current.innerHTML;
        const clean = html === '<br>' || html === '' ? '' : html;
        prevValueRef.current = clean;
        onChange(clean);
    }, [onChange]);

    const execCmd = useCallback((cmd, val = null) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, val);
        triggerChange();
    }, [triggerChange]);

    const handleKeyDown = useCallback((e) => {
        if (e.key === 'Enter') {
            if (e.shiftKey) {
                // Shift+Enter → soft line break (<br>)
                e.preventDefault();
                const sel = window.getSelection();
                if (sel && sel.rangeCount > 0) {
                    const range = sel.getRangeAt(0);
                    range.deleteContents();
                    const br = document.createElement('br');
                    range.insertNode(br);
                    // Move cursor after <br>
                    range.setStartAfter(br);
                    range.setEndAfter(br);
                    sel.removeAllRanges();
                    sel.addRange(range);
                }
                triggerChange();
            }
            // Regular Enter → browser creates <p> (via defaultParagraphSeparator)
        }
    }, [triggerChange]);


    const applyFont = useCallback((fontFamily) => {
        editorRef.current?.focus();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0 && !sel.getRangeAt(0).collapsed) {
            const span = document.createElement('span');
            span.style.fontFamily = fontFamily;
            const range = sel.getRangeAt(0);
            try {
                range.surroundContents(span);
            } catch {
                span.appendChild(range.extractContents());
                range.insertNode(span);
            }
        } else {
            // Apply to whole editor if nothing selected
            editorRef.current.style.fontFamily = fontFamily;
        }
        triggerChange();
    }, [triggerChange]);

    const applySize = useCallback((size) => {
        editorRef.current?.focus();
        const sel = window.getSelection();
        if (sel && sel.rangeCount > 0) {
            const range = sel.getRangeAt(0);
            const span = document.createElement('span');
            span.style.fontSize = size;
            if (!range.collapsed) {
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
            }
        }
        triggerChange();
    }, [triggerChange]);

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
                <div className="flex border border-gray-300 rounded overflow-hidden">
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

                <ToolbarBtn title="מודגש" onClick={() => execCmd('bold')}><b>B</b></ToolbarBtn>
                <ToolbarBtn title="נטוי" onClick={() => execCmd('italic')}><i>I</i></ToolbarBtn>
                <ToolbarBtn title="קו תחתון" onClick={() => execCmd('underline')}><u>U</u></ToolbarBtn>

                <div className="w-px h-6 bg-gray-300 mx-1" />

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

                <label title="צבע טקסט" className="relative w-8 h-8 flex items-center justify-center rounded hover:bg-gray-200 cursor-pointer transition-all group">
                    <span className="text-sm font-bold leading-none">A</span>
                    <input
                        type="color"
                        defaultValue="#000000"
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                        onInput={e => execCmd('foreColor', e.target.value)}
                    />
                    <div className="absolute bottom-0.5 left-1 right-1 h-1 rounded-sm" style={{background:'#000'}} />
                </label>

                <ToolbarBtn title="נקה עיצוב" onClick={() => execCmd('removeFormat')}>
                    <span className="text-xs font-normal">✕</span>
                </ToolbarBtn>
                <ToolbarBtn title="רקע כהה/בהיר לעריכה" onClick={() => setDarkEditor(d => !d)}>
                    <span style={{ fontSize: 14 }}>{darkEditor ? '☀️' : '🌙'}</span>
                </ToolbarBtn>
            </div>

            {/* Editable area */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                dir={dir}
                onInput={triggerChange}
                onKeyDown={handleKeyDown}
                className={`min-h-[120px] p-3 text-sm focus:outline-none leading-relaxed banner-editor-content transition-colors duration-200 ${darkEditor ? 'bg-gray-900' : 'bg-white'}`}
                style={{ textAlign: dir === 'rtl' ? 'right' : 'left' }}
                data-placeholder="הקלד כאן את הטקסט..."
            />
            <style>{`
                [data-placeholder]:empty:before {
                    content: attr(data-placeholder);
                    color: #9ca3af;
                    pointer-events: none;
                    display: block;
                }
                .banner-editor-content p {
                    margin: 0;
                    min-height: 1.2em;
                    padding: 0.15em 0;
                }
                .banner-editor-content div {
                    margin: 0;
                    min-height: 1.2em;
                }
                .banner-editor-content br {
                    display: block;
                    content: '';
                }
            `}</style>
        </div>
    );
}
