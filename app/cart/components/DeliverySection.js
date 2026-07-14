"use client";

import { useLanguage } from "../../context/LanguageContext";

export default function DeliverySection({ 
    isMainVendor, 
    vendorConfig, 
    deliveryMethod, 
    setDeliveryMethod 
}) {
    const { t } = useLanguage();

    if (!isMainVendor && !vendorConfig?.delivery_active && !vendorConfig?.self_pickup_active) {
        return null;
    }

    return (
        <div className="space-y-2">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest text-right">{t('cart.delivery_method')}</p>
            <div className="grid grid-cols-2 gap-3">
                {(isMainVendor || vendorConfig?.self_pickup_active) && (
                    <button
                        onClick={() => setDeliveryMethod('self_pickup')}
                        className={`col-span-2 sm:col-span-1 relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center ${deliveryMethod === 'self_pickup' ? 'border-black bg-black text-white shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                        </svg>
                        <span className="text-xs font-bold leading-tight">איסוף עצמי</span>
                        <span className={`text-xs font-bold ${deliveryMethod === 'self_pickup' ? 'text-green-400' : 'text-green-600'}`}>{t('cart.free')}</span>
                    </button>
                )}
                {(isMainVendor || vendorConfig?.delivery_active) && (
                    <button
                        onClick={() => setDeliveryMethod('mail')}
                        className={`col-span-2 sm:col-span-1 relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center ${deliveryMethod === 'mail' ? 'border-black bg-black text-white shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                        </svg>
                        <span className="text-xs font-bold leading-tight">משלוח עד נקודת איסוף</span>
                        <span className={`text-xs font-bold ${deliveryMethod === 'mail' ? 'text-gray-300' : 'text-gray-400'}`}>{isMainVendor ? 30 : (vendorConfig?.delivery_price || 0)} ₪</span>
                    </button>
                )}
                {(isMainVendor || vendorConfig?.delivery_active) && (
                    <button
                        onClick={() => setDeliveryMethod('home_delivery')}
                        className={`col-span-2 sm:col-span-2 relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-200 text-center ${deliveryMethod === 'home_delivery' ? 'border-black bg-black text-white shadow-md' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-400'}`}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
                        </svg>
                        <span className="text-xs font-bold leading-tight">משלוח עד הבית</span>
                        <span className={`text-xs font-bold ${deliveryMethod === 'home_delivery' ? 'text-gray-300' : 'text-gray-400'}`}>{isMainVendor ? 50 : (vendorConfig?.delivery_price ? vendorConfig.delivery_price + 20 : 0)} ₪</span>
                    </button>
                )}
            </div>
            {deliveryMethod === 'self_pickup' && (
                <p className="text-xs text-gray-500 text-center pt-1">{t('cart.pickup_address_note')}</p>
            )}
        </div>
    );
}
