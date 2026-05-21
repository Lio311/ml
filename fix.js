const fs = require('fs');

let c = fs.readFileSync('app/api/admin/generate-product-ai/route.js', 'utf8');

c = c.replace(
  'import { GoogleGenerativeAI } from "@google/generative-ai";',
  'import { GoogleGenerativeAI } from "@google/generative-ai";\nimport fs from "fs";\nimport path from "path";'
);

c = c.replace(/Finally, pick the best matching Spotify track URL[\s\S]*?\n\n/g, '');

c = c.replace(/  "spotify_track_url": "URL chosen from the list above"\n/g, '');

c = c.replace(/"description": "Hebrew description here",\n/g, '"description": "Hebrew description here"\n');

c = c.replace(
  /spotify_track_url: data\.spotify_track_url \|\| ''/g,
  'spotify_track_url: (() => { try { const t = JSON.parse(fs.readFileSync(path.join(process.cwd(), "app/lib/spotify_tracks.json"))); return "https://open.spotify.com/track/" + t[Math.floor(Math.random()*t.length)]; } catch(e) { return ""; } })()'
);

fs.writeFileSync('app/api/admin/generate-product-ai/route.js', c);
console.log("Fixed successfully");
