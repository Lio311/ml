import Link from "next/link";
import { cookies } from 'next/headers';
import he from '../../data/locales/he.json';
import en from '../../data/locales/en.json';

const getT = (locale) => {
  const dict = locale === 'en' ? en : he;
  return (key) => {
    const keys = key.split('.');
    let result = dict;
    for (const k of keys) {
      if (result[k]) result = result[k];
      else return key;
    }
    return result;
  };
};

export default async function CheckoutSuccessPage() {
    const cookieStore = await cookies();
    const locale = cookieStore.get('NEXT_LOCALE')?.value || 'he';
    const t = getT(locale);

    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
            <div className="text-6xl mb-6">🎉</div>
            <h1 className="text-4xl font-bold mb-4">{t('checkout_success.title')}</h1>
            <p className="text-xl text-gray-600 mb-8 max-w-md">
                {t('checkout_success.subtitle_p1')}
                <br />
                {t('checkout_success.subtitle_p2')}
            </p>

            <Link href="/catalog" className="btn btn-primary">
                {t('checkout_success.back_to_catalog')}
            </Link>
        </div>
    );
}
