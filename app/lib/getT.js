import he from '../data/locales/he.json';
import en from '../data/locales/en.json';

export const getT = (locale, brandName = null) => {
    const dict = locale === 'en' ? en : he;
    return (key, vars = {}) => {
        const keys = key.split('.');
        let result = dict;
        for (const k of keys) {
            if (result && result[k]) {
                result = result[k];
            } else {
                return vars?.defaultValue || key;
            }
        }
        
        if (typeof result === 'string') {
            if (brandName) {
                result = result.replace(/ml_tlv/g, brandName);
                result = result.replace(/ml-tlv(?!\.com)/g, brandName);
            }
            if (vars) {
                return Object.entries(vars).reduce((str, [k, v]) => {
                    return str.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
                }, result);
            }
        }
        
        return result;
    };
};
