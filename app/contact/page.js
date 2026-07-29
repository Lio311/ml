import ContactClient from "./ContactClient";
import BreadcrumbSchema from '../components/BreadcrumbSchema';

import { getBrand } from "../lib/brand";

export async function generateMetadata() {
    const brand = await getBrand();
    return {
        title: "צור קשר",
        description: "דברו איתנו - שירות לקוחות, שאלות נפוצות ופניות עסקיות.",
        alternates: {
            canonical: `https://www.${brand.hyphen}.com/contact`,
        },
    };
}

export default function ContactPage() {
    return (
        <>
            <BreadcrumbSchema items={[{ name: 'צור קשר' }]} />
            <ContactClient />
        </>
    );
}
