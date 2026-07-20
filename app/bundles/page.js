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
      <div className="container mx-auto px-4 pt-6">
        <Breadcrumbs items={[{ label: 'חבילות בשמים בהתאמה אישית' }]} />
        <BreadcrumbSchema items={[{ name: 'חבילות בשמים בהתאמה אישית' }]} />
      </div>
      <BundlesClient />
    </>
  );
}
