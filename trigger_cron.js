fetch('http://localhost:3000/api/cron/recommendations', { headers: { 'x-vercel-cron': '1' } }).then(r => r.json()).then(console.log).catch(console.error);
