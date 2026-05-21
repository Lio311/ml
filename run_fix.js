const https = require('https');

async function fixBatch(start, limit) {
    return new Promise((resolve, reject) => {
        console.log(`Fetching start=${start} limit=${limit}...`);
        https.get(`https://www.ml-tlv.com/api/admin/fix-all-songs?start=${start}&limit=${limit}`, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode !== 200) {
                    console.error("HTTP " + res.statusCode + " " + data);
                    resolve(null);
                } else {
                    resolve(JSON.parse(data));
                }
            });
        }).on('error', e => reject(e));
    });
}

async function main() {
    let start = 0;
    const limit = 5;
    let total = 200; // approximate
    
    while (start < total) {
        try {
            const result = await fixBatch(start, limit);
            if (!result) break;
            
            console.log(`Updated ${result.updatedCount} in this batch. Next start: ${result.nextStart}. Total: ${result.total}`);
            start = result.nextStart;
            total = result.total;
            
            if (result.updatedCount === 0 && start >= total) {
                break;
            }
        } catch (e) {
            console.error(e);
            break;
        }
    }
    console.log("Done!");
}

main();
