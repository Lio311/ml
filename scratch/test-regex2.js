const ltrRegex = /[A-Za-z0-9@.\-_#+/,()]+(?:[\s\u00A0]+[A-Za-z0-9@.\-_#+/,()]+)*/g;
const str = "1. Birkholz Sol e Samba | מידה: 2 ml | כמות: 1 | מחיר: ₪30";
const fixBidi = (str) => {
    if (!str) return '';
    let reversed = str.split('').reverse().join('');
    return reversed.replace(ltrRegex, match => match.split('').reverse().join(''));
};
console.log(fixBidi(str));
