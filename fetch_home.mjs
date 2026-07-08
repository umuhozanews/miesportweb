async function fetchHome() {
    const res = await fetch("https://www.soccertvhd.com/", {
        headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
        }
    });
    const html = await res.text();
    console.log(html);
}
fetchHome();
