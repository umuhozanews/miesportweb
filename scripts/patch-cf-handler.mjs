/**
 * Post-build patch for Cloudflare Workers on Windows.
 *
 * OpenNext's Windows build emits a `requireChunk` stub that always throws,
 * leaving all 130 Turbopack SSR chunk factories unregistered at runtime.
 * On Linux the same step embeds the chunk data inline; on Windows it doesn't.
 *
 * This script replicates that Linux behaviour: it reads every chunk file,
 * strips the `module.exports=` wrapper, builds an inline map, prepends it to
 * handler.mjs, and replaces both stub sites with a real lookup.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

const handlerPath = path.join(
  root,
  ".open-next/server-functions/default/handler.mjs"
);
const ssrDir = path.join(
  root,
  ".open-next/server-functions/default/.next/server/chunks/ssr"
);

if (!fs.existsSync(handlerPath)) {
  console.error("handler.mjs not found — run npm run build first");
  process.exit(1);
}
if (!fs.existsSync(ssrDir)) {
  console.error("SSR chunks directory not found:", ssrDir);
  process.exit(1);
}

const STUB =
  "function requireChunk(chunkPath){throw new Error(`Not found ${chunkPath}`)}";

// Fix: handler.mjs imports AsyncLocalStorage as AsyncLocalStorage2 but never sets it
// on globalThis. Next.js's createAsyncLocalStorage() checks globalThis.AsyncLocalStorage;
// if absent it falls back to FakeAsyncLocalStorage which throws on .run()/.exit().
// Set it on globalThis right after the import line so module factories see the real one.
const ALS_IMPORT = `import{AsyncLocalStorage as AsyncLocalStorage2}from"node:async_hooks"`;
const ALS_IMPORT_WITH_GLOBALSET = ALS_IMPORT + `;if(!globalThis.AsyncLocalStorage)globalThis.AsyncLocalStorage=AsyncLocalStorage2;`;

// Also patch __commonJS to not cache failed modules — without this fix, a first-call
// error sets mod={exports:{}} permanently, and every subsequent call silently returns {}
// instead of the real error, which makes ComponentMod.handler appear undefined.
const COMMON_JS_STUB =
  "var __commonJS=(cb,mod3)=>function(){return mod3||(0,cb[__getOwnPropNames(cb)[0]])((mod3={exports:{}}).exports,mod3),mod3.exports}";
const COMMON_JS_FIXED =
  "var __commonJS=(cb,mod3)=>function(){" +
  "if(mod3)return mod3.exports;" +
  "var _m={exports:{}};" +
  "try{(0,cb[__getOwnPropNames(cb)[0]])(_m.exports,_m);}" +
  "catch(e){console.error('[CF-PATCH] __commonJS error in',Object.keys(cb)[0],'->',e&&e.message,e&&e.stack&&e.stack.slice(0,400));throw e;}" +
  "mod3=_m;" +
  "return mod3.exports;" +
  "}";

let handler = fs.readFileSync(handlerPath, "utf8");

const handlerAlreadyPatched = !handler.includes(STUB);
if (handlerAlreadyPatched) {
  console.log("requireChunk stub not found — handler.mjs already patched, skipping handler patches.");
}

if (!handlerAlreadyPatched) {
  const chunkFiles = fs.readdirSync(ssrDir).filter((f) => f.endsWith(".js"));
  console.log(`Embedding ${chunkFiles.length} SSR chunks into handler.mjs...`);

  const entries = chunkFiles.flatMap((file) => {
    const chunkKey = `server/chunks/ssr/${file}`;
    const raw = fs.readFileSync(path.join(ssrDir, file), "utf8");

    // Only embed chunks that use the module.exports= format (factory arrays).
    // Files like [turbopack]_runtime.js are raw ES statements already bundled
    // by wrangler via handler.mjs.meta.json — embedding them would produce
    // invalid syntax (object value can't start with `const`).
    if (!raw.startsWith("module.exports=")) return [];

    let body = raw
      .replace(/^module\.exports=/, "")
      .replace(/;\s*\/\/# sourceMappingURL=[\s\S]*$/, "")
      .trim();
    if (body.endsWith(";")) body = body.slice(0, -1);

    return [`${JSON.stringify(chunkKey)}:${body}`];
  });

  // Also embed non-ssr chunks (server/chunks/) for the second turbopack runtime instance
  const nonSsrDir = path.join(
    root,
    ".open-next/server-functions/default/.next/server/chunks"
  );
  const nonSsrFiles = fs.readdirSync(nonSsrDir).filter(
    (f) => f.endsWith(".js") && !fs.statSync(path.join(nonSsrDir, f)).isDirectory()
  );
  console.log(`Embedding ${nonSsrFiles.length} non-SSR chunks...`);

  const nonSsrEntries = nonSsrFiles.flatMap((file) => {
    const chunkKey = `server/chunks/${file}`;
    const raw = fs.readFileSync(path.join(nonSsrDir, file), "utf8");
    if (!raw.startsWith("module.exports=")) return [];

    let body = raw
      .replace(/^module\.exports=/, "")
      .replace(/;\s*\/\/# sourceMappingURL=[\s\S]*$/, "")
      .trim();
    if (body.endsWith(";")) body = body.slice(0, -1);

    return [`${JSON.stringify(chunkKey)}:${body}`];
  });

  const mapDecl = `var __CF_CHUNK_MAP__={${[...entries, ...nonSsrEntries].join(",")}};`;
  const fixedRequireChunk =
    "function requireChunk(chunkPath){" +
    "var c=__CF_CHUNK_MAP__[chunkPath];" +
    "if(!c){console.error('[CF-PATCH] requireChunk: NOT FOUND',chunkPath);throw new Error('Not found '+chunkPath);}" +
    "return c;" +
    "}";

  // Patch AsyncLocalStorage global setup
  let patched = handler.includes(ALS_IMPORT)
    ? handler.replace(ALS_IMPORT, ALS_IMPORT_WITH_GLOBALSET)
    : handler;
  if (!handler.includes(ALS_IMPORT)) {
    console.warn("WARNING: AsyncLocalStorage import not found — globalThis.AsyncLocalStorage patch skipped");
  } else {
    console.log("Patched globalThis.AsyncLocalStorage assignment.");
  }

  // Patch __commonJS caching bug (must happen before splitStub to avoid double-processing)
  patched = patched.includes(COMMON_JS_STUB)
    ? patched.replace(COMMON_JS_STUB, COMMON_JS_FIXED)
    : patched;
  if (!patched.includes(COMMON_JS_FIXED)) {
    console.warn("WARNING: __commonJS stub not found — caching bug fix skipped");
  }

  // Replace all occurrences of the stub (there are two — one per Turbopack runtime copy)
  patched = mapDecl + "\n" + patched.split(STUB).join(fixedRequireChunk);

  // Patch Next.js's final catch block to include the real error message in the
  // response body — otherwise it swallows the error and only logs to console.
  const ISE_PATTERN =
    'this.logError((0,_iserror.getProperError)(err)),res.statusCode=500,res.body("Internal Server Error").send()';
  const ISE_WITH_DEBUG =
    '(function(){var _pe=(0,_iserror.getProperError)(err);' +
    'this.logError(_pe);' +
    'console.error("[CF-DEBUG] 500 error:",_pe&&_pe.message,_pe&&_pe.stack&&_pe.stack.slice(0,600));' +
    'res.statusCode=500;' +
    'res.setHeader("x-cf-debug","500");' +
    'res.body("[CF-DEBUG] "+String(_pe&&_pe.message||err)+"\\n\\nStack: "+String(_pe&&_pe.stack||"")).send();' +
    '}).call(this)';
  if (patched.includes(ISE_PATTERN)) {
    patched = patched.replace(ISE_PATTERN, ISE_WITH_DEBUG);
    console.log("Patched Next.js 500 error handler to surface errors.");
  } else {
    console.warn("WARNING: 500 error handler pattern not found — error body patching skipped");
  }

  // Add error-surfacing wrapper around the exported handler so actual errors are
  // visible in HTTP responses instead of the opaque "Internal Server Error".
  const HANDLER_EXPORT = "var handler2=await createMainHandler();export{handler2 as handler};";
  // Wrap both init and request handling to surface errors in HTTP responses.
  // If createMainHandler() fails (module-init error), we still export a handler
  // that returns the actual error text so it's visible in the HTTP body.
  const HANDLER_WITH_DEBUG =
    "var handler2;" +
    "try{handler2=await createMainHandler();}" +
    "catch(_initErr){" +
    "console.error('[CF-DEBUG] createMainHandler FAILED:',_initErr&&_initErr.message,_initErr&&_initErr.stack&&_initErr.stack.slice(0,800));" +
    "handler2=async()=>new Response('[CF-DEBUG] Init error: '+String(_initErr&&_initErr.message)+'\\n\\nStack: '+String(_initErr&&_initErr.stack),{" +
    "status:500,headers:{'content-type':'text/plain','x-cf-debug':'init-error'}});" +
    "}" +
    "var _dbgH2=handler2;" +
    "handler2=async(req,env,ctx,signal)=>{" +
    "try{return await _dbgH2(req,env,ctx,signal);}" +
    "catch(e){" +
    "console.error('[CF-DEBUG] HANDLER ERROR:',e&&e.message,e&&e.stack&&e.stack.slice(0,800));" +
    "return new Response('[CF-DEBUG] Request error: '+String(e&&e.message)+'\\n\\nStack: '+String(e&&e.stack),{" +
    "status:500,headers:{'content-type':'text/plain','x-cf-debug':'req-error'}});" +
    "}" +
    "};" +
    "export{handler2 as handler};";
  if (patched.includes(HANDLER_EXPORT)) {
    patched = patched.replace(HANDLER_EXPORT, HANDLER_WITH_DEBUG);
    console.log("Added error-surfacing wrapper to handler export.");
  } else {
    console.warn("WARNING: handler export pattern not found — error surfacing skipped");
  }

  fs.writeFileSync(handlerPath, patched);
  const sizeMB = (fs.statSync(handlerPath).size / 1024 / 1024).toFixed(2);
  const totalChunks = chunkFiles.length + nonSsrFiles.length;
  console.log(
    `Done. Patched handler.mjs → ${sizeMB} MB (${totalChunks} chunks embedded, __commonJS caching fixed).`
  );
}

// Patch load-manifest.external.js so that externalRequire() gets inline manifest data
// (handler.mjs has inline intercepts, but externalRequire loads the un-patched CJS version)
const loadManifestPath = path.join(
  root,
  ".open-next/server-functions/default/node_modules/next/dist/server/load-manifest.external.js"
);
const nextDistDir = path.join(root, ".open-next/server-functions/default/.next");
const manifestPaths = [
  "routes-manifest.json",
  "required-server-files.json",
  "prerender-manifest.json",
  "build-manifest.json",
  "app-path-routes-manifest.json",
  "server/server-reference-manifest.json",
  "server/prefetch-hints.json",
  "server/pages-manifest.json",
  "server/next-font-manifest.json",
  "server/middleware-manifest.json",
];
const inlineCacheEntries = manifestPaths.flatMap((name) => {
  const fullPath = path.join(nextDistDir, name);
  if (!fs.existsSync(fullPath)) return [];
  try {
    const data = JSON.parse(fs.readFileSync(fullPath, "utf8"));
    return [`${JSON.stringify("/" + name)}: ${JSON.stringify(data)}`];
  } catch { return []; }
});
const buildId = fs.existsSync(path.join(nextDistDir, "BUILD_ID"))
  ? fs.readFileSync(path.join(nextDistDir, "BUILD_ID"), "utf8").trim()
  : "";
// Inject the cache lookup INSIDE the loadManifest function body (before _fs.readFileSync).
// We can't override exports.loadManifest because _export() creates a getter-only property.
const inlineCacheDecl =
  `var __CF_MANIFEST_INLINE_CACHE__ = {${inlineCacheEntries.join(",\n")}};\n` +
  `var __CF_BUILD_ID__ = ${JSON.stringify(buildId)};\n`;
// Injection site: right after the early-return for the cache hit
const LM_INJECT_AFTER = `    if (cached) {\n        return cached;\n    }`;
const LM_INJECTED =
  LM_INJECT_AFTER +
  `\n    // CF PATCH: inline manifest cache\n` +
  `    var _cfn = (path || "").replaceAll("\\\\", "/");\n` +
  `    if (_cfn.endsWith("BUILD_ID") || _cfn.endsWith("/BUILD_ID")) return process.env.NEXT_BUILD_ID || __CF_BUILD_ID__;\n` +
  `    for (var _cfk in __CF_MANIFEST_INLINE_CACHE__) {\n` +
  `      if (_cfn.endsWith(_cfk)) return __CF_MANIFEST_INLINE_CACHE__[_cfk];\n` +
  `    }`;
// Also patch evalManifest the same way
const EM_INJECT_AFTER = `    if (cached) {\n        return cached;\n    }\n    let content;`;
const EM_INJECTED =
  `    if (cached) {\n        return cached;\n    }\n` +
  `    // CF PATCH: inline manifest cache\n` +
  `    var _cfne = (path || "").replaceAll("\\\\", "/");\n` +
  `    if (_cfne.endsWith("BUILD_ID") || _cfne.endsWith("/BUILD_ID")) return process.env.NEXT_BUILD_ID || __CF_BUILD_ID__;\n` +
  `    for (var _cfke in __CF_MANIFEST_INLINE_CACHE__) {\n` +
  `      if (_cfne.endsWith(_cfke)) return __CF_MANIFEST_INLINE_CACHE__[_cfke];\n` +
  `    }\n    let content;`;
let lmSrc = fs.readFileSync(loadManifestPath, "utf8");
if (!lmSrc.includes("CF PATCH")) {
  lmSrc = inlineCacheDecl + lmSrc;
  if (lmSrc.includes(LM_INJECT_AFTER)) {
    lmSrc = lmSrc.replace(LM_INJECT_AFTER, LM_INJECTED);
    console.log("Injected inline cache into loadManifest body.");
  } else {
    console.warn("WARNING: loadManifest injection site not found");
  }
  if (lmSrc.includes(EM_INJECT_AFTER)) {
    lmSrc = lmSrc.replace(EM_INJECT_AFTER, EM_INJECTED);
    console.log("Injected inline cache into evalManifest body.");
  } else {
    console.warn("WARNING: evalManifest injection site not found");
  }
  fs.writeFileSync(loadManifestPath, lmSrc);
  console.log(`Patched load-manifest.external.js with ${inlineCacheEntries.length} inline manifests.`);
} else {
  console.log("load-manifest.external.js already patched — skipping.");
}

// Patch instrumentation-globals.external.js to stub out the require() of instrumentation.js.
// When app-page-turbo uses a.t() (Turbopack's runtimeRequire = CF Workers native require),
// it bypasses the Turbopack module registry and loads the real .external.js file.
// That file calls require(path.join(process.cwd(), distDir, "server", "instrumentation.js"))
// = require("/.next/server/instrumentation.js") which CF Workers can't resolve.
// We stub the try block so it just returns null (no instrumentation = safe default).
const instrGlobalsPath = path.join(
  root,
  ".open-next/server-functions/default/node_modules/next/dist/server/lib/router-utils/instrumentation-globals.external.js"
);
const INSTR_REQUIRE_PATTERN =
  "cachedInstrumentationModule = (0, _interopdefault.interopDefault)(await require(_nodepath.default.join(projectDir, distDir, 'server', `${_constants.INSTRUMENTATION_HOOK_FILENAME}.js`)));";
const INSTR_REQUIRE_STUB =
  "cachedInstrumentationModule = null; // CF PATCH: no instrumentation file in edge runtime";
let instrSrc = fs.readFileSync(instrGlobalsPath, "utf8");
if (!instrSrc.includes("CF PATCH")) {
  if (instrSrc.includes(INSTR_REQUIRE_PATTERN)) {
    instrSrc = instrSrc.replace(INSTR_REQUIRE_PATTERN, INSTR_REQUIRE_STUB);
    fs.writeFileSync(instrGlobalsPath, instrSrc);
    console.log("Patched instrumentation-globals.external.js to stub out instrumentation.js require.");
  } else {
    console.warn("WARNING: instrumentation-globals.external.js require pattern not found — patch skipped");
    console.warn("  Expected:", JSON.stringify(INSTR_REQUIRE_PATTERN.slice(0, 80)));
    const idx = instrSrc.indexOf("cachedInstrumentationModule = ");
    if (idx !== -1) console.warn("  Found instead:", JSON.stringify(instrSrc.slice(idx, idx + 150)));
  }
} else {
  console.log("instrumentation-globals.external.js already patched — skipping.");
}
