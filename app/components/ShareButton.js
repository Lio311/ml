"use client";

import toast from 'react-hot-toast';
import { useLanguage } from '../context/LanguageContext';

export default function ShareButton({ name }) {
    const { t } = useLanguage();

    const handleShare = (e) => {
        e.preventDefault();
        e.stopPropagation();

        const url = window.location.href;

        if (navigator.share) {
            navigator.share({
                title: name,
                text: t('common.share_text').replace('{name}', name),
                url: url
            }).catch(console.error);
        } else {
            navigator.clipboard.writeText(url).then(() => {
                toast.success(t('common.link_copied_toast'));
            });
        }
    };

    return (
        <button
            onClick={handleShare}
            className="w-10 h-10 flex items-center justify-center bg-white hover:bg-gray-50 text-gray-600 hover:text-blue-600 rounded-full transition shadow-md border border-gray-100"
            title={t('common.share_product')}
        >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                <path fillRule="evenodd" d="M15.75 4.5a3 3 0 1 1 .825 2.066l-8.421 4.679a3.002 3.002 0 0 1 0 1.51l8.421 4.679a3 3 0 1 1-.729 1.31l-8.421-4.678a3 3 0 1 1 0-4.132l8.421-4.679a3 3 0 0 1-.096-.755Z" clipRule="evenodd" />
            </svg>
        </button>
    );
}
