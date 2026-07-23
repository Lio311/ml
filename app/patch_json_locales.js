const fs = require('fs');

['he', 'en'].forEach(lang => {
    const path = `./data/locales/${lang}.json`;
    const data = JSON.parse(fs.readFileSync(path, 'utf8'));
    data.common.sort_default = lang === 'he' ? 'ברירת מחדל' : 'Default';
    fs.writeFileSync(path, JSON.stringify(data, null, 4));
    console.log(`Updated ${lang}.json`);
});
