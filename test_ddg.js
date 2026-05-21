const fs = require('fs');
async function test() {
    try {
        const res = await fetch("https://lite.duckduckgo.com/lite/", {
            method: "POST",
            headers: {
                "Content-Type": "application/x-www-form-urlencoded",
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
            },
            body: "q=site:open.spotify.com/track/ bellini samba"
        });
        const html = await res.text();
        fs.writeFileSync("ddg.html", html);
        console.log("Saved to ddg.html");
    } catch(e) {
        console.error("Error:", e);
    }
}
test();
