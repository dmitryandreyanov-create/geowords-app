const CACHE="geowords-v0.3";
const CORE=[
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./data/levels.js",
  "./manifest.webmanifest",
  "./assets/mountains-puzzle-1.webp",
  "./assets/mountains-puzzle-2.webp",
  "./assets/mountains-puzzle-3.webp",
  "./assets/mountains-puzzle-4.webp",
  "./assets/mountains-puzzle-5.webp",
  "./assets/mountains-puzzle-6.webp",
  "./assets/mountains-puzzle-7.webp",
  "./assets/mountains-puzzle-8.webp",
  "./assets/mountains-puzzle-9.webp",
  "./assets/mountains-puzzle-10.webp",
  "./assets/mountains-puzzle-11.webp",
  "./assets/icon-192.png",
  "./assets/icon-512.png"
];

self.addEventListener("install",event=>{
  event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)).then(()=>self.skipWaiting()));
});

self.addEventListener("activate",event=>{
  event.waitUntil(
    caches.keys()
      .then(keys=>Promise.all(keys.filter(key=>key!==CACHE).map(key=>caches.delete(key))))
      .then(()=>self.clients.claim())
  );
});

self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET") return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then(response=>{
        if(response && response.ok){
          const copy=response.clone();
          caches.open(CACHE).then(cache=>cache.put(event.request,copy));
        }
        return response;
      })
      .catch(()=>caches.match(event.request).then(cached=>cached||caches.match("./index.html")))
  );
});
