"use client";
import React, { useRef, useEffect, useState } from 'react';
import { 
    Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, 
    Type, Image as ImageIcon, Link as LinkIcon, Palette, Undo, Redo,
    ChevronDown, Variable, Sparkles, ShoppingBag
} from 'lucide-react';

export default function VisualEditor({ value, onChange, placeholder = "כאן כותבים את המייל...", onInsertHTML }) {
    const editorRef = useRef(null);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Set initial content once mounted
    useEffect(() => {
        if (isMounted && editorRef.current && value) {
            editorRef.current.innerHTML = value;
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isMounted]);

    useEffect(() => {
        if (editorRef.current && value !== editorRef.current.innerHTML) {
            // Only update if external value is different and not already focused
            // This handles external changes while avoiding cursor jumps during typing
            if (document.activeElement !== editorRef.current) {
                editorRef.current.innerHTML = value || "";
            }
        }
    }, [value]);

    // Export insertion method via prop if needed
    useEffect(() => {
        if (onInsertHTML && isMounted) {
            onInsertHTML.current = (html) => execCommand('insertHTML', html);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [onInsertHTML, isMounted]);

    const execCommand = (command, val = null) => {
        if (editorRef.current) {
            editorRef.current.focus();
        }
        document.execCommand(command, false, val);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const handleInput = () => {
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
        }
    };

    const addPlaceholder = (placeholder) => {
        execCommand('insertHTML', `{{${placeholder}}}`);
    };

    const addLink = () => {
        const url = prompt("הכנס כתובת קישור (URL):", "https://");
        if (url) execCommand('createLink', url);
    };

    const addImage = () => {
        const url = prompt("הכנס כתובת תמונה (URL):");
        if (url) execCommand('insertImage', url);
    };

    const formatBlock = (tag) => {
        execCommand('formatBlock', tag);
    };

    const changeColor = (e) => {
        execCommand('foreColor', e.target.value);
    };

    const placeholders = [
        { key: 'name', label: 'שם לקוח' },
        { key: 'orderId', label: 'מספר הזמנה' },
        { key: 'total', label: 'סה"כ לתשלום' },
        { key: 'points', label: 'נקודות צבורות' },
        { key: 'link', label: 'קישור לאתר' },
    ];

    if (!isMounted) return <div className="h-64 border rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400">טוען עורך...</div>;

    return (
        <div className="flex flex-col border border-gray-200 rounded-3xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center gap-1 p-3 bg-gray-50/50 border-b border-gray-100 backdrop-blur-sm sticky top-0 z-10">
                <div className="flex items-center gap-0.5 border-l border-gray-200 pl-2 ml-1">
                    <ToolbarButton onClick={() => execCommand('bold')} icon={<Bold size={16} />} title="בולד" />
                    <ToolbarButton onClick={() => execCommand('italic')} icon={<Italic size={16} />} title="נטוי" />
                    <ToolbarButton onClick={() => execCommand('underline')} icon={<Underline size={16} />} title="קו תחתון" />
                </div>

                <div className="flex items-center gap-2 border-l border-gray-200 pl-2 ml-1">
                    <select 
                        onChange={(e) => execCommand('fontName', e.target.value)}
                        className="text-[10px] font-bold border-none bg-transparent focus:ring-0 cursor-pointer text-gray-600 hover:text-black transition-colors"
                        title="בחר פונט"
                    >
                        <option value="inherit">פונט</option>
                        <option value="Assistant, sans-serif">Assistant</option>
                        <option value="Arial, sans-serif">Arial</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="Times New Roman, serif">Times</option>
                        <option value="Courier New, monospace">Courier</option>
                    </select>
                </div>

                <div className="flex items-center gap-0.5 border-l border-gray-200 pl-2 ml-1">
                    <ToolbarButton onClick={() => formatBlock('<h1>')} icon={<span className="font-bold text-xs">H1</span>} title="כותרת 1" />
                    <ToolbarButton onClick={() => formatBlock('<h2>')} icon={<span className="font-bold text-xs">H2</span>} title="כותרת 2" />
                    <ToolbarButton onClick={() => formatBlock('<p>')} icon={<span className="font-bold text-xs">P</span>} title="טקסט רגיל" />
                </div>

                <div className="flex items-center gap-0.5 border-l border-gray-200 pl-2 ml-1">
                    <ToolbarButton onClick={() => execCommand('justifyLeft')} icon={<AlignLeft size={16} />} title="שמאל" />
                    <ToolbarButton onClick={() => execCommand('justifyCenter')} icon={<AlignCenter size={16} />} title="מרכז" />
                    <ToolbarButton onClick={() => execCommand('justifyRight')} icon={<AlignRight size={16} />} title="ימין" />
                </div>

                <div className="flex items-center gap-0.5 border-l border-gray-200 pl-2 ml-1 text-right" dir="rtl">
                   <div className="relative group/color">
                        <button className="p-2 hover:bg-white rounded-xl transition-all text-gray-600">
                            <Palette size={16} />
                        </button>
                        <input 
                            type="color" 
                            className="absolute inset-0 opacity-0 cursor-pointer" 
                            onChange={changeColor}
                        />
                   </div>
                   <ToolbarButton onClick={addLink} icon={<LinkIcon size={16} />} title="הוסף קישור" />
                   <ToolbarButton onClick={addImage} icon={<ImageIcon size={16} />} title="הוסף תמונה" />
                </div>

                <div className="flex items-center gap-2 mr-auto" dir="rtl">
                    <div className="relative group/ph">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 bg-black text-white text-[10px] font-black rounded-full hover:bg-gray-800 transition-all uppercase tracking-tight">
                            <Variable size={12} />
                            מילות מפתח
                            <ChevronDown size={10} />
                        </button>
                        <div className="absolute top-full left-0 mt-1 w-40 bg-white border border-gray-100 rounded-2xl shadow-xl opacity-0 invisible group-hover/ph:opacity-100 group-hover/ph:visible transition-all z-20 overflow-hidden">
                            {placeholders.map(ph => (
                                <button 
                                    key={ph.key}
                                    type="button"
                                    onClick={() => addPlaceholder(ph.key)}
                                    className="w-full text-right px-4 py-2.5 text-[11px] font-bold text-gray-700 hover:bg-gray-50 hover:text-black transition-colors border-b border-gray-50 last:border-0"
                                >
                                    {ph.label} (<code>{`{{${ph.key}}}`}</code>)
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Editor Area */}
            <div className="relative min-h-[400px]">
                <div 
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onBlur={handleInput}
                    className="w-full h-full min-h-[400px] p-6 outline-none prose prose-slate max-w-none text-right"
                    dir="rtl"
                    style={{ fontFamily: "'Open Sans', Arial, sans-serif" }}
                />
                {!value && (
                    <div className="absolute top-6 right-6 text-gray-300 pointer-events-none font-medium">
                        {placeholder}
                    </div>
                )}
            </div>

            {/* Status / Info bar */}
            <div className="px-5 py-2 bg-gray-50/30 border-t border-gray-50 flex items-center justify-between text-[9px] font-black uppercase text-gray-400">
                <div className="flex items-center gap-3">
                    <span>HTML: {value?.length || 0} תווים</span>
                </div>
                <div className="flex items-center gap-1 text-green-600">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    עורך ויזואלי פעיל
                </div>
            </div>
        </div>
    );
}

function ToolbarButton({ onClick, icon, title }) {
    return (
        <button
            type="button"
            onClick={(e) => { e.preventDefault(); onClick(); }}
            title={title}
            className="p-2 hover:bg-white hover:text-black text-gray-600 rounded-xl transition-all active:scale-90"
        >
            {icon}
        </button>
    );
}
