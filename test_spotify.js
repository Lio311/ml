async function test() {
    try {
        const res = await fetch("https://open.spotify.com/get_access_token?reason=transport&productType=web_player", {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        });
        const data = await res.json();
        console.log("Token:", data.accessToken ? "SUCCESS" : "FAIL", data);

        const token = data.accessToken;
        
        const searchRes = await fetch("https://api.spotify.com/v1/search?q=bellini+samba&type=track&limit=5", {
            headers: {
                "Authorization": `Bearer ${token}`
            }
        });
        const searchData = await searchRes.json();
        console.log("Search:", searchData.tracks.items.map(t => `${t.name} - ${t.artists[0].name}`));
    } catch(e) {
        console.error("Error", e);
    }
}
test();
