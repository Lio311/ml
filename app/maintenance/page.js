import MaintenanceClient from './MaintenanceClient';
import { getBrand } from '@/app/lib/brand';

export const metadata = {
    title: 'האתר בשיפוצים',
    description: 'אנחנו עובדים על שדרוג החוויה שלכם. נחזור לאוויר בהקדם האפשרי.',
};

export default async function MaintenancePage() {
    const brand = await getBrand();
    return <MaintenanceClient brand={brand} />;
}
