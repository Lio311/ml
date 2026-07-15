import { GET } from './app/api/cron/daily-summary/route.js';

async function run() {
    const req = {
        headers: {
            get: (key) => 'Bearer ' + process.env.CRON_SECRET
        }
    };
    try {
        const res = await GET(req);
        const data = await res.json();
        console.log("Response:", data);
    } catch (e) {
        console.error("Error:", e);
    }
    process.exit(0);
}
run();
