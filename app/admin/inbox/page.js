import InboxClient from "../../components/Chat/InboxClient";

export const metadata = {
    title: "תיבת דואר - ניהול | ml_tlv",
};

export default function AdminInboxPage() {
    return (
        <div className="p-2 md:p-8">
            <h1 className="text-3xl font-bold mb-6">תיבת דואר לקוחות</h1>
            <p className="text-gray-500 mb-8">כאן משויכות כל ההודעות שנשלחו מהלקוחות לצוות האתר הרשמי.</p>
            <InboxClient role="admin" />
        </div>
    );
}
