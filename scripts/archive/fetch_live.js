import https from 'https';
import fs from 'fs';
https.get('https://ml-tlv.com/catalog?q=FUGAZZI', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    fs.writeFileSync('c:/Users/Lior/.gemini/antigravity/scratch/ml/app/live_html.html', data);
    console.log("Wrote HTML to live_html.html");
  });
}).on('error', err => console.error(err));
