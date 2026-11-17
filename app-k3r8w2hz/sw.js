const CACHE='the-routine-v2';
const CORE=['./','index.html','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(CACHE).then(c=>c.addAll(CORE)).then(()=>self.skipWaiting()));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{
  const r=e.request; if(r.method!=='GET') return;
  const u=new URL(r.url);
  if(u.origin===location.origin){
    // network first so updates arrive; cached copy when offline
    e.respondWith(fetch(r).then(res=>{const cp=res.clone(); caches.open(CACHE).then(c=>c.put(r,cp)); return res;}).catch(()=>caches.match(r).then(m=>m||caches.match('index.html'))));
  } else if(u.hostname.endsWith('fonts.googleapis.com')||u.hostname.endsWith('fonts.gstatic.com')){
    e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone(); caches.open(CACHE).then(c=>c.put(r,cp)); return res;})));
  }
});
