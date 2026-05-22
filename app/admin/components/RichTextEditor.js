import dynamic from 'next/dynamic';

const RichTextEditorClient = dynamic(() => import('./RichTextEditorClient'), {
    ssr: false,
    loading: () => <div className="w-full h-32 border border-gray-300 rounded-lg bg-gray-50 animate-pulse" />,
});

export default function RichTextEditor(props) {
    return <RichTextEditorClient {...props} />;
}
