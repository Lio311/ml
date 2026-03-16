import InboxClient from '../components/Chat/InboxClient';

export const metadata = {
    title: "תיבת הודעות | ml_tlv",
};

export default function InboxPage() {
    return (
        <div className="container py-12 max-w-5xl">
            <h1 className="text-3xl font-bold mb-8">תיבת הודעות</h1>
            <InboxClient role="buyer" />
        </div>
    );
}
