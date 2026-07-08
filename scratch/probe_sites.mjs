async function probe(url) {
    console.log(`\n--- Probing: ${url} ---`);
    try {
        const res = await fetch(url, {
            headers: {
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
            },
            signal: AbortSignal.timeout(8000)
        });
        console.log(`Status: ${res.status} ${res.statusText}`);
        console.log("Headers:");
        for (const [k, v] of res.headers.entries()) {
            console.log(`  ${k}: ${v}`);
        }
        const text = await res.text();
        console.log(`HTML Length: ${text.length}`);
        
        // Let's inspect technologies in HTML
        if (text.includes("wp-content") || text.includes("wp-includes") || text.includes("/wp-json/")) {
            console.log("-> Technology Detected: WordPress");
        }
        if (text.includes("next/static") || text.includes("_next/data")) {
            console.log("-> Technology Detected: Next.js");
        }
        if (text.includes("react")) {
            console.log("-> Technology Detected: React");
        }
        if (text.includes("cloudflare") || text.includes("cf-challenge")) {
            console.log("-> Cloudflare challenge/protection detected in HTML");
        }
        
        // Find player scripts
        const videoJs = text.match(/video-js|vjs/gi);
        if (videoJs) console.log("-> Video Player: Video.js");
        
        const hlsJs = text.match(/hls\.js|hls\.min\.js/gi);
        if (hlsJs) console.log("-> Video Library: Hls.js");

        const Clappr = text.match(/clappr/gi);
        if (Clappr) console.log("-> Video Player: Clappr");

        const jwPlayer = text.match(/jwplayer/gi);
        if (jwPlayer) console.log("-> Video Player: JW Player");

    } catch (e) {
        console.error(`Error probing ${url}:`, e.message);
    }
}

async function run() {
    await probe("https://www.soccertvhd.com/");
    await probe("https://score808.me/");
}
run();
