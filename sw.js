// Ágynemű futár – service worker (telepíthetőség + offline indulás)
// Az oldal mindig a hálózatról jön, ha van net (így a frissítések azonnal megérkeznek); offline a mentett példány indul.
const V='futar-1.6.0';
const SHELL=['./','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
const LIB='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL).then(()=>c.add(LIB).catch(()=>{}))));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request;if(r.method!=='GET')return;
  const u=new URL(r.url);
  if(u.origin===self.location.origin){
    const page=r.mode==='navigate'||u.pathname.endsWith('/')||u.pathname.endsWith('.html');
    if(page){
      e.respondWith(fetch(r,{cache:'no-store'}).then(res=>{
        if(res.ok){const cp=res.clone();caches.open(V).then(c=>c.put('./',cp))}
        return res;
      }).catch(()=>caches.match('./')));
      return;
    }
    e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>m||fetch(r)));
    return;
  }
  if(r.url===LIB)e.respondWith(caches.match(r).then(m=>m||fetch(r).then(res=>{const cp=res.clone();caches.open(V).then(c=>c.put(r,cp));return res})));
});
