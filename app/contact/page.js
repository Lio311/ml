import ContactClient from "./ContactClient";

export const metadata = {
    title: "צור קשר | ml_tlv",
    description: "דברו איתנו - שירות לקוחות, שאלות נפוצות ופניות עסקיות.",
    alternates: {
        canonical: 'https://www.ml-tlv.com/contact',
    },
};

export default function ContactPage() {
    return <ContactClient />;
}
