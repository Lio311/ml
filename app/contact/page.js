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
            <div className="bg-[#fafafa] pt-8">
                <div className="container mx-auto px-4 md:px-8">
                    <Breadcrumbs items={[{ label: 'צור קשר' }]} />
                    <BreadcrumbSchema items={[{ name: 'צור קשר' }]} />
                </div>
            </div>
            <ContactClient />
        </>
    );
}
