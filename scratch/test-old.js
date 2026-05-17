const str = '1. Birkholz Sol e Samba | מידה: 2 ml | כמות: 1 | מחיר: ₪30';
const fixBidi = (str) => {
    if (!str) return '';
    let reversed = str.split('').reverse().join('');
    return reversed;
};
console.log(fixBidi(str));
