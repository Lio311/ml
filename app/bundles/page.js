import BundlesClient from './BundlesClient';
import Breadcrumbs from '../components/Breadcrumbs';
import BreadcrumbSchema from '../components/BreadcrumbSchema';

export const metadata = {
  title: 'חבילות בשמים בהתאמה אישית',
  description: 'הרכיבו לעצמכם חבילת בשמים יוקרתית (קיץ, דייטים, אספנים) במחיר משתלם במיוחד.',
  alternates: {
    canonical: 'https://www.ml-tlv.com/bundles',
  },
};

export default function BundlesPage() {
  return (
    <>
            <BreadcrumbSchema items={[{ name: 'חבילות בשמים בהתאמה אישית' }]} />
      <BundlesClient />
    </>
  );
}
