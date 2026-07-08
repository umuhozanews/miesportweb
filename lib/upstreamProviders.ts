/**
 * Upstream providers for soccer streams.
 * These are the 'bridge' sites that provide the actual HLS/m3u8 links.
 * We mimic the headers and request patterns used by sites like SoccerTVHD.
 */

export const UPSTREAM_PROVIDERS = {
  yalla_shoot: {
    name: "Yalla Shoot",
    homepage: "https://www.yalla-shoot-7asry.com/",
    matchPattern: /<a[^>]+href="(https:\/\/www\.yalla-shoot-7asry\.com\/[^"]+?\/)"[^>]*>/gi,
    referer: "https://www.yalla-shoot-7asry.com/",
    origin: "https://www.yalla-shoot-7asry.com",
  },
  kooora4live: {
    name: "Kooora4Live",
    homepage: "https://kooora4live.org/",
    matchPattern: /<a[^>]+href="(https:\/\/kooora4live\.org\/[^"]+?\/)"[^>]*>/gi,
    referer: "https://kooora4live.org/",
    origin: "https://kooora4live.org",
  },
  hesgoal: {
    name: "Hesgoal",
    homepage: "https://www.hesgoal.tv/",
    matchPattern: /<a[^>]+href="([^"]+?)"[^>]*>([\s\S]+?)<\/a>/gi,
    referer: "https://www.hesgoal.tv/",
    origin: "https://www.hesgoal.tv",
  }
};

export async function fetchWithProviderHeaders(url: string, providerKey: keyof typeof UPSTREAM_PROVIDERS) {
  const provider = UPSTREAM_PROVIDERS[providerKey];
  return fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "referer": provider.referer,
      "origin": provider.origin,
    },
  });
}
