async function test() {
    try {
        const url = "https://open.spotify.com/track/6S3JlQUWk1Ifb3O12Y8s61";
        const res = await fetch(`https://open.spotify.com/oembed?url=${url}`);
        const data = await res.json();
        console.log("oEmbed:", data);
    } catch(e) {
        console.error("Error:", e);
    }
}
test();
