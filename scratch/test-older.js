const str = '1. Birkholz Sol e Samba | מידה: 2 ml | כמות: 1 | מחיר: ₪30';
const fixBidi = (str) => {
    if (!str) return '';
    const hasHebrew = /[\u0590-\u05FF]/;
    if (!hasHebrew.test(str)) return str;

    const words = str.split(' ').reverse();
    const fixedWords = words.map(word => {
        if (hasHebrew.test(word)) {
            return word.split('').reverse().join('');
        }
        return word; 
    });
    return fixedWords.join(' ');
};
console.log(fixBidi(str));
