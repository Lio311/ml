import AdminCatalogsClient from "./AdminCatalogsClient";

export const metadata = {
    title: "ניהול קטלוגים | Admin | ml_tlv",
    description: "ניהול קטלוגים של ספקים חיצוניים/משתמשים",
};

export default function AdminCatalogsPage() {
    return (
        <div className="container py-8 max-w-6xl">
            <h1 className="text-3xl font-bold mb-6">קטלוגים של משתמשים</h1>
            <AdminCatalogsClient />
        </div>
    );
}
