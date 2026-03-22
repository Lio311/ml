const fs = require('fs');
const path = require('path');

const enPath = path.join(__dirname, '../app/data/locales/en.json');
const hePath = path.join(__dirname, '../app/data/locales/he.json');

const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
const he = JSON.parse(fs.readFileSync(hePath, 'utf8'));

function getKeys(obj, prefix = '') {
    let keys = [];
    for (const key in obj) {
        if (typeof obj[key] === 'object' && obj[key] !== null) {
            keys = keys.concat(getKeys(obj[key], `${prefix}${key}.`));
        } else {
            keys.push(`${prefix}${key}`);
        }
    }
    return keys;
}

const enKeys = new Set(getKeys(en));
const heKeys = new Set(getKeys(he));

const missingInHe = [...enKeys].filter(k => !heKeys.has(k));
const missingInEn = [...heKeys].filter(k => !enKeys.has(k));

console.log('Missing in HE:', missingInHe);
console.log('Missing in EN:', missingInEn);
