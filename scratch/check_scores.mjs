async function check() {
    const dates = ["20260705", "20260706", "20260707", "20260708", "20260709", "20260710", "20260711", "20260712"];
    console.log("Checking FIFA World Cup schedules for this week...");
    for (const d of dates) {
        try {
            const url = `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${d}&limit=20`;
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                const events = data?.events ?? [];
                if (events.length > 0) {
                    console.log(`\nDate: ${d}`);
                    for (const ev of events) {
                        const status = ev.status?.type?.state;
                        const detail = ev.status?.type?.detail;
                        const home = ev.competitions?.[0]?.competitors?.[0]?.team?.displayName;
                        const away = ev.competitions?.[0]?.competitors?.[1]?.team?.displayName;
                        console.log(`  - ${home} vs ${away} : Status = ${status} (${detail})`);
                    }
                }
            }
        } catch (e) {
            console.error(`Error checking date ${d}:`, e.message);
        }
    }
}
check();
