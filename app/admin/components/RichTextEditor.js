'use client';

import dynamic from 'next/dynamic';

const RichTextEditorClient = dynamic(() => import('./RichTextEditorClient'), {
    ssr: false,
    loading: () => <div className="min-h-[150px] flex items-center justify-center bg-gray-50 border border-gray-200 rounded text-gray-400">טוען עורך טקסט...</div>
});

export default function RichTextEditor(props) {
    return <RichTextEditorClient {...props} />;
}
