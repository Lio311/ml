import ContactClient from "./ContactClient";
import Breadcrumbs from '../components/Breadcrumbs';
import BreadcrumbSchema from '../components/BreadcrumbSchema';

export const metadata = {
    title: "צור קשר",
    description: "דברו איתנו - שירות לקוחות, שאלות נפוצות ופניות עסקיות.",
    alternates: {
        canonical: 'https://www.ml-tlv.com/contact',
import ContactClient from "./ContactClient";
import Breadcrumbs from '../components/Breadcrumbs';
import BreadcrumbSchema from '../components/BreadcrumbSchema';

export const metadata = {
    title: "צור קשר",
    description: "דברו איתנו - שירות לקוחות, שאלות נפוצות ופניות עסקיות.",
    alternates: {
        canonical: 'https://www.ml-tlv.com/contact',
    },
};

export default function ContactPage() {
    return (
        <>
            <BreadcrumbSchema items={[{ name: 'צור קשר' }]} />
            <ContactClient />
        </>
    );
}
