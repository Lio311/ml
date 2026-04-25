import InboxClient from "../../components/Chat/InboxClient";

export const metadata = {
    title: "תיבת דואר Admin",
};

export default function AdminInboxPage() {
    return (
        <div className="w-full">
            <InboxClient role="admin" />
        </div>
    );
}
