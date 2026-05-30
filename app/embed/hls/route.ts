export function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const streamUrl = searchParams.get("url") ?? "";
  const slug = searchParams.get("slug") ?? "";

  if (!streamUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  const isProxyPath = streamUrl.startsWith("/api/hls");
  let isAllowedDirect = false;
  try {
    const parsed = new URL(streamUrl);
    isAllowedDirect = parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch { /* ignore */ }

  if (!isProxyPath && !isAllowedDirect) {
    return new Response("Disallowed stream URL", { status: 403 });
  }

  const proxySrc = isProxyPath ? `${origin}${streamUrl}` : streamUrl;

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  html,body{width:100%;height:100%;background:#000;overflow:hidden}
  video{width:100%;height:100%;display:block;object-fit:contain}
  #err{display:none;position:absolute;inset:0;align-items:center;justify-content:center;background:#0a0a0f;color:rgba(255,255,255,0.4);font:700 13px/1.4 sans-serif;text-align:center;padding:20px}
</style>
</head>
<body>
<video id="v" autoplay controls playsinline></video>
<div id="err">Reconnecting to stream…</div>
<script src="/hls.min.js"></script>
<script>
(function(){
  var proxySrc = ${JSON.stringify(proxySrc)};
  var slug = ${JSON.stringify(slug)};

  var v = document.getElementById('v');
  var err = document.getElementById('err');
  var hls = null;
  var refreshTimer = null;
  var currentSrc = proxySrc;
  var switchCount = 0;  // times we've asked parent to advance to next server
  var MAX_SWITCH = 3;   // give up after this many failed switch attempts
  var recoveryCount = 0;

  function clearTimer() {
    if (refreshTimer) { clearTimeout(refreshTimer); refreshTimer = null; }
  }

  function scheduleRefresh(ms) {
    clearTimer();
    refreshTimer = setTimeout(proactiveRefresh, ms);
  }

  function showErr() {
    clearTimer();
    err.textContent = 'Stream unavailable. Try another server.';
    v.style.display = 'none';
    err.style.display = 'flex';
    // Tell parent to advance to the next server in its list
    try { window.parent.postMessage({type:'hls-error'}, '*'); } catch(e){}
  }

  // Called on any fatal stream failure.
  // Immediately tells the parent frame to switch to the next server (embed iframe etc.)
  // instead of retrying the same blocked URL over and over.
  function onStreamFail() {
    clearTimer();
    if (switchCount >= MAX_SWITCH) { showErr(); return; }
    switchCount++;
    // Signal parent to switch server NOW
    try { window.parent.postMessage({type:'hls-error'}, '*'); } catch(e){}
    err.textContent = 'Reconnecting…';
    err.style.display = 'flex';
    // Fallback: if parent has no more servers, try a fresh URL after 3s
    refreshTimer = setTimeout(proactiveRefresh, 3000);
  }

  // Proactive URL refresh — fetches a fresh CDN token URL without destroying the player.
  // Uses hls.stopLoad() + hls.loadSource() + hls.startLoad() to swap the manifest URL
  // in-place: the existing buffer is preserved and playback never visibly interrupts.
  function proactiveRefresh() {
    if (!slug) return;
    fetch(
      '/api/stream-servers?slug=' + encodeURIComponent(slug) + '&_t=' + Date.now(),
      { cache: 'no-store' }
    )
      .then(function(r) { return r.json(); })
      .then(function(d) {
        var servers = d.servers || [];
        var newUrl = null;
        for (var i = 0; i < servers.length; i++) {
          var s = servers[i];
          if (s && (s.startsWith('/api/hls') || /\\.m3u8/i.test(s))) {
            newUrl = s.startsWith('http') ? s : (window.location.origin + s);
            break;
          }
        }

        if (newUrl && newUrl !== currentSrc && hls) {
          // Seamless in-place manifest switch — buffer stays intact, no black screen
          currentSrc = newUrl;
          hls.stopLoad();
          hls.loadSource(newUrl);
          hls.startLoad(-1); // -1 = live edge
          switchCount = 0;
          err.style.display = 'none';
          v.style.display = '';
        }

        // Keep refreshing every 50s to stay ahead of CDN token expiry
        if (hls) scheduleRefresh(50000);
      })
      .catch(function() {
        if (hls) scheduleRefresh(50000);
      });
  }

  function hlsCreate(src) {
    clearTimer();
    currentSrc = src;
    recoveryCount = 0;
    if (hls) { try { hls.destroy(); } catch(e){} hls = null; }

    hls = new Hls({
      debug: false,

      // ── Buffer ───────────────────────────────────────────────────────────
      // 30-second buffer absorbs proxy latency spikes, brief CDN hiccups,
      // and network jitter without any visible stutter.
      // soccertvhd does not proxy at all (browser fetches CDN directly), so
      // they never need a large buffer. We compensate with extra depth.
      maxBufferLength: 30,
      maxMaxBufferLength: 90,

      // ── Live sync ────────────────────────────────────────────────────────
      // Stay 5 segments behind the live edge — comfortable cushion.
      // Tight sync (3 segments) is fine for direct CDN; through a proxy
      // every extra round-trip burns buffer, so we give more headroom.
      liveSyncDurationCount: 5,
      liveMaxLatencyDurationCount: 15,

      // ── Manifest loading ─────────────────────────────────────────────────
      manifestLoadingTimeOut: 8000,
      manifestLoadingMaxRetry: 2,
      manifestLoadingRetryDelay: 500,
      levelLoadingTimeOut: 8000,
      levelLoadingMaxRetry: 2,

      // ── Segment loading ──────────────────────────────────────────────────
      // Fail fast (2 retries, 500ms delay) then let onStreamFail() switch
      // to the next server. Do NOT retry 6 times — that wastes 30+ seconds
      // on a CDN-blocked URL and causes the visible play/stutter loop.
      fragLoadingTimeOut: 10000,
      fragLoadingMaxRetry: 2,
      fragLoadingRetryDelay: 500,

      // ── Quality / ABR ────────────────────────────────────────────────────
      startLevel: -1,
      abrEwmaDefaultEstimate: 2000000, // prefer high quality, avoid ABR thrashing

      enableWorker: true,
    });

    hls.loadSource(src);
    hls.attachMedia(v);

    hls.on(Hls.Events.MANIFEST_PARSED, function() {
      if (v.paused) v.play().catch(function(){});
      err.style.display = 'none';
      v.style.display = '';
      switchCount = 0;
      // Proactive token refresh before CDN token expires (~60s CDN window)
      if (slug) scheduleRefresh(50000);
    });

    hls.on(Hls.Events.ERROR, function(event, data) {
      if (!data.fatal) return;

      // MEDIA_ERROR (decoder glitch): attempt in-place recovery once —
      // this avoids a full reconnect for transient decode errors.
      if (data.type === Hls.ErrorTypes.MEDIA_ERROR && recoveryCount < 1) {
        recoveryCount++;
        hls.recoverMediaError();
        return;
      }

      // Network error (CDN blocked/slow) or unrecoverable media error:
      // switch to the next server immediately — the current one is failing.
      recoveryCount = 0;
      onStreamFail();
    });
  }

  // ── Browser detection and startup ────────────────────────────────────────────

  if (typeof Hls !== 'undefined' && Hls.isSupported()) {
    // Chrome, Firefox, Android — HLS.js through same-origin proxy (no CORS)
    hlsCreate(proxySrc);

  } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
    // iOS / macOS Safari — native HLS via the same proxy URL.
    // The proxy URL is same-origin so Safari can fetch it without CORS issues.
    v.src = proxySrc;
    v.load();
    v.play().catch(function(){});
    v.addEventListener('loadedmetadata', function() { v.play().catch(function(){}); });
    v.addEventListener('error', function() { onStreamFail(); });
    if (slug) scheduleRefresh(50000);

  } else {
    // Last-resort fallback
    v.src = proxySrc;
    v.load();
    v.play().catch(function(){});
    v.addEventListener('error', function() { showErr(); });
  }
})();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Security-Policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'unsafe-inline'; media-src 'self' blob: https:; connect-src 'self' https:; frame-ancestors 'self'",
    },
  });
}
