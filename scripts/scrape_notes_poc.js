const https = require('https');

const url = "https://www.fragrantica.com/perfume/Creed/Aventus-9828.html";

console.log(`Fetching ${url}...`);

const options = {
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
    }
};

https.get(url, options, (res) => {
    console.log('Status Code:', res.statusCode);

    if (res.statusCode !== 200) {
        console.error('Failed to fetch page');
        return;
    }

    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log('Page fetched successfully. Length:', data.length);

        // Simple Regex extraction for POC
        // Fragrantica usually has structure like: "<h4>Top Notes</h4>...content..."
        // Or specific divs with "pyramid" classes.

        // Let's try to find the "Pyramid" section content generally
        // Note: The actual HTML structure might vary, this is a blind attempt to see if we get ANY text back
        // or if we are blocked.

        if (data.includes('Cloudflare') || data.includes('Access denied')) {
            console.error('Blocked by Cloudflare/Security.');
        } else {
            console.log('Page content seems accessible (not obviously blocked).');

            // Try to find note keywords
            const hasTop = data.includes('Top Notes') || data.includes('Top notes');
            const hasMiddle = data.includes('Middle Notes') || data.includes('Middle notes');
            const hasBase = data.includes('Base Notes') || data.includes('Base notes');

            console.log('Contains "Top Notes":', hasTop);
            console.log('Contains "Middle Notes":', hasMiddle);
            console.log('Contains "Base Notes":', hasBase);

            // Attempt to grab a snippet around "Top Notes" to see if we can parse it
            if (hasTop) {
                const index = data.indexOf('Top Notes');
                console.log('Snippet around Top Notes:', data.substring(index, index + 500));
            }
        }
    });

}).on('error', (e) => {
    console.error('Error:', e);
});
