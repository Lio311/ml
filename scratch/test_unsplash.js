const fetch = require('node-fetch');

async function testUnsplash(query) {
    try {
        const url = `https://unsplash.com/s/photos/${encodeURIComponent(query)}`;
        const res = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
        });
        const html = await res.text();
        
        // Find URLs of form https://images.unsplash.com/photo-...
        const regex = /https:\/\/images\.unsplash\.com\/photo-[a-zA-Z0-9-]+/g;
        const matches = html.match(regex);
        if (matches && matches.length > 0) {
            // Filter unique ones and append parameters
            const unique = [...new Set(matches)];
            console.log(`Found ${unique.length} images for query: "${query}"`);
            console.log(unique.slice(0, 3).map(img => `${img}?auto=format&fit=crop&q=80&w=1000`));
            return unique[0];
        } else {
            console.log("No images found.");
        }
    } catch (err) {
        console.error("Unsplash fetch error:", err);
    }
}

testUnsplash("luxury perfume vanilla");
