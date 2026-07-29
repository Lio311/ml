import BannerClient from './BannerClient';
import { getBrandName } from '@/app/lib/brand';

export const metadata = {
  title: "ניהול באנרים Admin",
  robots: "noindex, nofollow",
};

export default async function BannerPage() {
  const brandName = await getBrandName();
  return <BannerClient brandName={brandName} />;
}
