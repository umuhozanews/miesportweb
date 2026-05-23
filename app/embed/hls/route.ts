import { getOriginalStreamUrl } from "@/lib/hlsProxy";

export function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const streamUrl = searchParams.get("url") ?? "";

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
<div id="err">Stream unavailable.<br>Try another server.</div>
<!-- Self-hosted hls.js — no CDN dependency, works on all networks -->
<script src="/hls.min.js"></script>
<script>
(function(){
  var proxySrc = ${JSON.stringify(proxySrc)};
  var directSrc = ${JSON.stringify(directSrc)};
  var v = document.getElementById('v');
  var err = document.getElementById('err');
  var hls = null;

  function showErr(){
    v.style.display='none';
    err.style.display='flex';
    try { window.parent.postMessage({type:'hls-error'},'*'); } catch(e){}
  }

  function hlsLoad(src) {
    if (!src) return false;
    if (typeof Hls === 'undefined' || !Hls.isSupported()) return false;
    if (hls) { try { hls.destroy(); } catch(e){} hls = null; }
    hls = new Hls({
      debug: false,
      // Buffer settings — keep lean so mobile doesn't OOM
      maxBufferLength: 10,
      maxMaxBufferLength: 30,
      // Live sync — tolerate higher latency so mobile data doesn't cause stalls
      liveSyncDurationCount: 3,
      liveMaxLatencyDurationCount: 10,
      // Generous timeouts for mobile data connections
      manifestLoadingTimeOut: 10000,
      manifestLoadingMaxRetry: 3,
      manifestLoadingRetryDelay: 500,
      levelLoadingTimeOut: 10000,
      levelLoadingMaxRetry: 3,
      fragLoadingTimeOut: 20000,
      fragLoadingMaxRetry: 6,
      fragLoadingRetryDelay: 500,
      // Start conservatively — let ABR ramp up; avoids initial stall on slow connections
      startLevel: -1,
      abrEwmaDefaultEstimate: 500000,
      enableWorker: false,
    });
    hls.loadSource(src);
    hls.attachMedia(v);
    hls.on(Hls.Events.MANIFEST_PARSED, function(){ v.play().catch(function(){}); });
    hls.on(Hls.Events.ERROR, function(event, data){
      if (!data.fatal) return;
      showErr();
    });
    return true;
  }

  if (typeof Hls !== 'undefined' && Hls.isSupported()) {
    // Chrome, Firefox, Android Chrome — CORS blocks direct CDN for XHR,
    // so go straight to the same-origin proxy (never blocked by CORS).
    hlsLoad(proxySrc);

  } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
    // iOS Safari native HLS — media element fetches bypass CORS, so try direct CDN
    // first (no extra hop), then fall back to proxy.
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
      } else {
        showErr();
      }
    });
    tryNative(nativeSrc);

  } else {
    // Browser doesn't advertise HLS support — try proxy URL as raw video src anyway.
    // Some browsers (Samsung Internet, older Android) can play HLS natively without canPlayType.
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
