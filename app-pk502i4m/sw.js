const V='the-annual-v4';
const CORE=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/maskable-512.png','icons/apple-180.png','icons/favicon-64.png','fonts/dmsans.woff2','fonts/inter.woff2','fonts/mono.woff2'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(V).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==V).map(x=>caches.delete(x)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(u.origin===location.origin && (r.mode==='navigate')){
    e.respondWith(fetch(r).then(res=>{const cp=res.clone(); caches.open(V).then(c=>c.put('index.html',cp)); return res;}).catch(()=>caches.match('index.html')));
    return;
  }
  if(u.origin===location.origin || /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)){
    e.respondWith(caches.match(r).then(hit=>hit||fetch(r).then(res=>{ if(res.ok||res.type==='opaque'){const cp=res.clone(); caches.open(V).then(c=>c.put(r,cp));} return res; })));
  }
});
