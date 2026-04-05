import InboxClient from "../../components/Chat/InboxClient";

export const metadata = {
    title: "תיבת דואר - ניהול | ml_tlv",
};

export default function AdminInboxPage() {
    return (
        <div className="p-2 md:p-8">
            <InboxClient role="admin" />
        </div>
    );
}
