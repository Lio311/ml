const fixBidi = (str) => {
    if (!str) return '';
    let reversed = str.split('').reverse().join('');
    const ltrRegex = /[A-Za-z0-9@.\-_#+/]+(?:\s+[A-Za-z0-9@.\-_#+/]+)*/g;
    return reversed.replace(ltrRegex, match => match.split('').reverse().join(''));
};

const lines = [
    'הזמנה מספר #271',
    'תאריך: 16.5.2026',
    'שם: יעל גרוסבוים',
    'אימייל: yaelgr253@gmail.com',
    'טלפון: 052-8260716',
    'שיטת שילוח: משלוח',
    '1. Suncrest Lang Ulrich 1 ml | מידה: 5 | כמות: 1 | מחיר: ₪40',
    'סה"כ לתשלום: ₪40.50'
];

lines.forEach(line => console.log(fixBidi(line)));
