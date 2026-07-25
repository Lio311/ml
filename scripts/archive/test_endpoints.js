require('dotenv').config({ path: '.env.local' });
const https = require('https');
const options = {
  hostname: 'console.neon.tech',
  path: `/api/v2/projects/${process.env.NEON_PROJECT_ID}/endpoints`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${process.env.NEON_API_KEY}`,
    'Accept': 'application/json'
  }
};
const req = https.request(options, res => {
  let data = '';
  res.on('data', d => data += d);
  res.on('end', () => console.log(JSON.stringify(JSON.parse(data), null, 2)));
});
req.on('error', console.error);
req.end();
