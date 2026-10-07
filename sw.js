const CACHE="geowords-v0.3.2";
const CORE=[
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./data/levels.js",
  "./manifest.webmanifest",
  "./assets/icon-180.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

const NETWORK_TIMEOUT_MS=3000;

self.addEventListener("install",event=>{
  event.waitUntil(
    caches.open(CACHE)
      .then(cache=>cache.addAll(CORE))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

async function fetchWithTimeout(request){
  const controller=new AbortController();
  const timer=setTimeout(()=>controller.abort(),NETWORK_TIMEOUT_MS);
  try{
    return await fetch(request,{signal:controller.signal});
  }finally{
    clearTimeout(timer);
  }
}

async function networkFirst(request){
  try{
    const response=await fetchWithTimeout(request);
    if(response && response.ok){
      const copy=response.clone();
      caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{});
    }
    return response;
  }catch{
    const cached=await caches.match(request);
    if(cached)return cached;

    if(request.mode==="navigate"){
      const shell=await caches.match("./index.html");
      if(shell)return shell;
    }

    return new Response("Offline",{status:503,statusText:"Offline"});
  }
}

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  event.respondWith(networkFirst(event.request));
});
