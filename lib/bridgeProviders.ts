/**
 * Bridge providers for soccer streams.
 * These are the 'relay' domains that SoccerTVHD mimics.
 */

export const BRIDGE_PROVIDERS = {
  vidsrc: {
    name: "Video Source",
    urlPattern: "https://vidsrc.me/embed/soccer/{id}",
    referer: "https://vidsrc.me/",
  },
  sportscentral: {
    name: "Sports Central",
    urlPattern: "https://sportscentral.io/streams-table/{id}/soccer",
    referer: "https://sportscentral.io/",
  },
  buffstream: {
    name: "BuffStream",
    urlPattern: "https://buffstream.io/embed/{id}",
    referer: "https://buffstream.io/",
  },
  soccertvhd_relay: {
    name: "SoccerTVHD Internal",
    urlPattern: "https://embed.soccertvhd.com/player/{id}",
    referer: "https://www.soccertvhd.com/",
  }
};

export type BridgeProvider = keyof typeof BRIDGE_PROVIDERS;

export async function fetchWithBridgeHeaders(url: string, provider: BridgeProvider) {
  const bridge = BRIDGE_PROVIDERS[provider];
  return fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      "referer": bridge.referer,
      "origin": new URL(bridge.referer).origin,
      "sec-fetch-dest": "iframe",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "cross-site",
    },
  });
}
