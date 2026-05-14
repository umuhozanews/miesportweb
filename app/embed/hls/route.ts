export const runtime = "edge";

export function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const streamUrl = searchParams.get("url") ?? "";

  if (!streamUrl) {
    return new Response("Missing url parameter", { status: 400 });
  }

  // Allow relative /api/hls/ proxy paths or known CDN hosts
  const isProxyPath = streamUrl.startsWith("/api/hls/");
  let isAllowedDirect = false;
  try {
    const parsed = new URL(streamUrl);
    isAllowedDirect =
      parsed.protocol === "https:" &&
      (parsed.hostname.endsWith(".cachefly.net") ||
        parsed.pathname.endsWith(".m3u8") ||
        parsed.pathname.endsWith(".mpd"));
  } catch { /* ignore */ }

  if (!isProxyPath && !isAllowedDirect) {
    return new Response("Disallowed stream URL", { status: 403 });
  }

  const absoluteSrc = isProxyPath ? `${origin}${streamUrl}` : streamUrl;

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
<script src="https://cdn.jsdelivr.net/npm/hls.js@1.5.13/dist/hls.min.js"></script>
<script>
(function(){
  var src = ${JSON.stringify(absoluteSrc)};
  var v = document.getElementById('v');
  var err = document.getElementById('err');
  function showErr(){ v.style.display='none'; err.style.display='flex'; }
  if (typeof Hls !== 'undefined' && Hls.isSupported()) {
    var hls = new Hls({
      debug: false,
      fragLoadingMaxRetry: 6,
      fragLoadingRetryDelay: 1000,
      manifestLoadingMaxRetry: 3
    });
    hls.loadSource(src);
    hls.attachMedia(v);
    hls.on(Hls.Events.MANIFEST_PARSED, function(){ v.play().catch(function(){}); });
    hls.on(Hls.Events.ERROR, function(e, d){
      if (d.fatal) showErr();
    });
  } else if (v.canPlayType('application/vnd.apple.mpegurl')) {
    v.src = src;
    v.addEventListener('loadedmetadata', function(){ v.play().catch(function(){}); });
    v.addEventListener('error', showErr);
  } else {
    showErr();
  }
})();
</script>
</body>
</html>`;

  return new Response(html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
