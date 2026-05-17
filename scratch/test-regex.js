const str = '1. Birkholz Sol e Samba | מידה: 2 ml | כמות: 1 | מחיר: ₪30';
let reversed = str.split('').reverse().join('');
const ltrRegex = /[A-Za-z0-9@.\-_#+/,()]+(?:[\s\u00A0]+[A-Za-z0-9@.\-_#+/,()]+)*/g;
console.log(reversed.replace(ltrRegex, match => match.split('').reverse().join('')));
