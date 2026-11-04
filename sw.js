// Ágynemű futár – service worker (telepíthetőség, offline indulás, megosztás fogadása)
// Az oldal mindig a hálózatról jön, ha van net (így a frissítések azonnal megérkeznek); offline a mentett példány indul.
const V='futar-1.11.2';
const SHARE='futar-share';
const SHELL=['./','./manifest.webmanifest','./icon-192.png','./icon-512.png','./icon-maskable-512.png'];
const LIB='https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js';
self.addEventListener('install',e=>{
  e.waitUntil(caches.open(V).then(c=>c.addAll(SHELL).then(()=>c.add(LIB).catch(()=>{}))));
  self.skipWaiting();
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==V&&k!==SHARE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  // Megosztás az appba (Viber üzenet szövege vagy Excel fájl) → elmentjük, és megnyitjuk az appot
  if(r.method==='POST'&&u.origin===self.location.origin&&u.pathname.endsWith('/share')){
    e.respondWith((async()=>{
      try{
        const f=await r.formData(),c=await caches.open(SHARE);
        const text=['title','text','url'].map(k=>f.get(k)).filter(x=>typeof x==='string'&&x.trim()).join('\n');
        await c.put('share-text',new Response(text));
        const file=f.get('file');
        if(file&&typeof file!=='string'&&file.size)await c.put('share-file',new Response(file));
      }catch(err){}
      return Response.redirect(new URL('./?shared=1',self.registration.scope).href,303);
    })());
    return;
  }
  if(r.method!=='GET')return;
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
