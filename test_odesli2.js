async function test() {
    try {
        console.log("Searching iTunes...");
        const itunesRes = await fetch("https://itunes.apple.com/search?term=levitating+dua+lipa&entity=song&limit=1");
        const itunesData = await itunesRes.json();
        const trackUrl = itunesData.results[0].trackViewUrl;
        console.log("iTunes URL:", trackUrl);

        console.log("Looking up Odesli...");
        const odesliRes = await fetch(`https://api.song.link/v1-alpha.1/links?url=${encodeURIComponent(trackUrl)}`);
        const odesliData = await odesliRes.json();
        
        console.log("Spotify URL:", odesliData.linksByPlatform.spotify?.url);
    } catch(e) {
        console.error("Error:", e);
    }
}
test();
