/* The Classbook service worker: offline app shell. */
const CACHE="classbook-814fb520ee";
const CORE=["./", "index.html", "manifest.webmanifest", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png", "icons/apple-touch-icon.png", "icons/favicon-64.png", "fonts/fredoka-500.woff2", "fonts/fredoka-600.woff2", "fonts/fredoka-700.woff2", "fonts/figtree-400.woff2", "fonts/figtree-500.woff2", "fonts/figtree-600.woff2", "fonts/figtree-700.woff2", "fonts/figtree-800.woff2"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith("classbook-")&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
const timeout=(p,ms)=>new Promise((res,rej)=>{const t=setTimeout(()=>rej(new Error("timeout")),ms);p.then(v=>{clearTimeout(t);res(v)},e=>{clearTimeout(t);rej(e)})});
self.addEventListener("fetch",e=>{
  const r=e.request;if(r.method!=="GET")return;
  const u=new URL(r.url);if(u.origin!==self.location.origin)return;
  if(r.mode==="navigate"){
    e.respondWith(timeout(fetch(r),4000).then(res=>{if(res.ok){const cp=res.clone();caches.open(CACHE).then(c=>c.put("index.html",cp))}return res})
      .catch(()=>caches.match("index.html").then(m=>m||caches.match("./"))));
    return;
  }
  e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>m||fetch(r).then(res=>{if(res.ok&&res.type==="basic"){const cp=res.clone();caches.open(CACHE).then(c=>c.put(r,cp))}return res})));
});
