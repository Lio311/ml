'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const DEFAULT = {
    name: 'ml_tlv',
    dot: 'ml.',
    hyphen: 'ml-tlv',
    short: 'ml',
    instagram: 'ml_tlv',
    titleSuffix: ' | ml_tlv',
    fullTitle: 'ml_tlv | דוגמיות בשמים',
};

const BrandContext = createContext(DEFAULT);

export function BrandProvider({ children, initialBrand }) {
    const [brand, setBrand] = useState(initialBrand || DEFAULT);

    useEffect(() => {
        fetch('/api/admin/brand')
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data && data.name) {
                    setBrand({
                        name: data.name,
                        dot: data.dot || (data.name.split('_')[0] + '.'),
                        hyphen: data.hyphen || data.name.replace(/_/g, '-'),
                        short: data.short || data.name.split('_')[0],
                        instagram: data.instagram || data.name,
                        titleSuffix: ` | ${data.name}`,
                        fullTitle: `${data.name} | דוגמיות בשמים`,
                    });
                }
            })
            .catch(() => {}); // keep defaults on error
    }, []);

    return <BrandContext.Provider value={brand}>{children}</BrandContext.Provider>;
}

export function useBrand() {
    return useContext(BrandContext);
}
