import InboxClient from "../../components/Chat/InboxClient";

export const metadata = {
    title: "תיבת דואר - ניהול | ml_tlv",
};

export default function AdminInboxPage() {
    return (
        <div className="w-full">
            <InboxClient role="admin" />
        </div>
    );
}
