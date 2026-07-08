const URL = "https://live.yalla-shoot-7asry.com/";

async function debug() {
    console.log(`\n--- Testing Yalla Shoot Live: ${URL} ---`);
    try {
        const response = await fetch(URL, {
            headers: {
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
            },
        });
        if (response.ok) {
            const text = await response.text();
            console.log("Success! HTML length:", text.length);
            // Look for match containers
            const matches = text.match(/<div[^>]+class="[^"]*match-container[^"]*"[^>]*>([\s\S]+?)<\/div>/gi) ||
                          text.match(/<a[^>]+href="[^"]*match[^"]*"[^>]*>([\s\S]+?)<\/a>/gi);
            console.log("Matches found:", matches?.length || 0);
            if (matches && matches.length > 0) {
                console.log("Sample match HTML:", matches[0].slice(0, 500));
            }
        } else {
            console.log("Failed:", response.status);
        }
    } catch (e) {
        console.error("Error:", e.message);
    }
}

debug();
