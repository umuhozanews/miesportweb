import { getOriginalStreamUrl } from "@/lib/hlsProxy";

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

  // Absolute proxy URL — same origin as this page, no CORS
  const proxySrc = isProxyPath ? `${origin}${streamUrl}` : streamUrl;

  // Original CDN URL (for iOS Safari native HLS which can access it without CORS)
  let directSrc: string | null = null;
  if (isProxyPath) {
    directSrc = getOriginalStreamUrl(streamUrl);
  }

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
<!-- Self-hosted hls.js — no CDN dependency, works on all networks -->
<script src="/hls.min.js"></script>
<script>
(function(){
  var proxySrc = ${JSON.stringify(proxySrc)};
  var directSrc = ${JSON.stringify(directSrc)};
  var slug = ${JSON.stringify(slug)};

  var v = document.getElementById('v');
  var err = document.getElementById('err');
  var hls = null;
  var refreshTimer = null;
  var refreshAttempts = 0;
  var MAX_REFRESH = 8;
  var isFatalPending = false;

  function showErr() {
    err.textContent = 'Stream unavailable. Try another server.';
    v.style.display = 'none';
    err.style.display = 'flex';
    try { window.parent.postMessage({type:'hls-error'}, window.location.origin); } catch(e){}
  }

  function scheduleRefresh(ms) {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(doRefresh, ms);
  }

  function doRefresh() {
    if (!slug) { if (isFatalPending) showErr(); return; }
    if (refreshAttempts >= MAX_REFRESH) { showErr(); return; }
    refreshAttempts++;

    // Cache-bust so we always get a fresh token, not a stale cached response
    fetch('/api/stream-servers?slug=' + encodeURIComponent(slug) + '&_t=' + Date.now(), {cache:'no-store'})
      .then(function(r){ return r.json(); })
      .then(function(d){
        var servers = d.servers || [];
        var newUrl = null;
        for (var i = 0; i < servers.length; i++) {
          var s = servers[i];
          if (s && (s.startsWith('/api/hls') || /\\.m3u8/i.test(s))) {
            newUrl = s.startsWith('http') ? s : (window.location.origin + s);
            break;
          }
        }

        if (!newUrl) {
          // No HLS stream yet — retry sooner
          scheduleRefresh(isFatalPending ? 6000 : 12000);
          return;
        }

        // Got a fresh URL — reset error state and reload stream
        refreshAttempts = 0;
        isFatalPending = false;
        err.style.display = 'none';
        v.style.display = '';

        if (typeof Hls !== 'undefined' && Hls.isSupported()) {
          hlsLoad(newUrl);
        } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
          v.src = newUrl;
          v.load();
          v.play().catch(function(){});
        }
        // Next proactive refresh in 50s (well before 60s token expiry)
        scheduleRefresh(50000);
      })
      .catch(function(){
        scheduleRefresh(isFatalPending ? 5000 : 15000);
      });
  }

  function hlsLoad(src) {
    if (!src) return false;
    if (typeof Hls === 'undefined' || !Hls.isSupported()) return false;
    if (hls) { try { hls.destroy(); } catch(e){} hls = null; }
    hls = new Hls({
      debug: false,
      maxBufferLength: 12,
      maxMaxBufferLength: 40,
      liveSyncDurationCount: 3,
      liveMaxLatencyDurationCount: 10,
      manifestLoadingTimeOut: 10000,
      manifestLoadingMaxRetry: 4,
      manifestLoadingRetryDelay: 1000,
      levelLoadingTimeOut: 10000,
      levelLoadingMaxRetry: 4,
      fragLoadingTimeOut: 20000,
      fragLoadingMaxRetry: 6,
      fragLoadingRetryDelay: 1000,
      startLevel: -1,
      abrEwmaDefaultEstimate: 500000,
      // Enable worker for better performance on mobile (offloads demuxing from main thread)
      enableWorker: true,
    });
    hls.loadSource(src);
    hls.attachMedia(v);
    hls.on(Hls.Events.MANIFEST_PARSED, function(){
      v.play().catch(function(){});
      // Proactively refresh stream URL 50s from now — before the CDN token expires (~60s)
      if (slug) scheduleRefresh(50000);
    });
    hls.on(Hls.Events.ERROR, function(event, data){
      if (!data.fatal) return;
      // Fatal error: try refreshing token first, only show error if all retries fail
      isFatalPending = true;
      err.textContent = 'Reconnecting…';
      err.style.display = 'flex';
      if (slug && refreshAttempts < MAX_REFRESH) {
        scheduleRefresh(800);
      } else {
        showErr();
      }
    });
    return true;
  }

  if (typeof Hls !== 'undefined' && Hls.isSupported()) {
    // Chrome, Firefox, Android Chrome — go straight to the same-origin proxy
    hlsLoad(proxySrc);

  } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
    // iOS Safari native HLS — try direct CDN first, then proxy, then refresh
    var nativeSrc = (directSrc && directSrc !== proxySrc) ? directSrc : proxySrc;
    var usingDirect = nativeSrc !== proxySrc;
    function tryNative(src) {
      v.src = src;
      v.load();
      v.play().catch(function(){});
    }
    v.addEventListener('loadedmetadata', function(){ v.play().catch(function(){}); });
    v.addEventListener('error', function(){
      if (usingDirect) {
        usingDirect = false;
        tryNative(proxySrc);
      } else if (slug && refreshAttempts < MAX_REFRESH) {
        isFatalPending = true;
        scheduleRefresh(800);
      } else {
        showErr();
      }
    });
    tryNative(nativeSrc);
    // Proactive refresh for iOS too
    if (slug) scheduleRefresh(50000);

  } else {
    // Fallback for browsers that advertise no HLS support
    v.src = proxySrc;
    v.load();
    v.play().catch(function(){});
    v.addEventListener('error', function(){ showErr(); });
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
