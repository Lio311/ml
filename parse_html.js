import fs from 'fs';
const data = fs.readFileSync('c:/Users/Lior/.gemini/antigravity/scratch/ml/app/live_html.html', 'utf8');
const match = data.match(/initialProducts\\":\\[(.*?)\\]/);
if (match) {
  console.log("Found initialProducts, length of match:", match[1].length);
  if (match[1].length === 0) console.log("Empty initialProducts array");
} else {
  console.log("Could not find initialProducts");
}
