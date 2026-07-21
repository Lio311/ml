import fs from 'fs';

const html = fs.readFileSync('c:/Users/Lior/.gemini/antigravity/scratch/ml/app/live_html.html', 'utf8');

if (html.includes('Passionfroudh')) {
    console.log("Found Passionfroudh!!");
} else {
    console.log("NOT FOUND Passionfroudh");
}

// "מציג 0 מוצרים" in unicode might be escaped, so let's just check if it contains "מציג"
if (html.includes('מציג')) {
    console.log("Found מציג");
} else {
    console.log("NOT FOUND מציג");
}

console.log("Length of HTML:", html.length);
