self.addEventListener('install',e=>self.skipWaiting());
self.addEventListener('activate',e=>e.waitUntil(self.clients.claim()));

self.addEventListener('fetch',e=>{
  const url=new URL(e.request.url);
  if(url.origin!==location.origin||!url.pathname.includes('/play/'))return;
  e.respondWith((async()=>{
    const cache=await caches.open('preview');
    let res=await cache.match(url.href.split('?')[0]);
    if(!res&&url.pathname.endsWith('/'))
      res=await cache.match(url.href+'index.html');
    if(!res)return new Response('Not found: '+url.pathname,{status:404});

    const range=e.request.headers.get('range');
    if(range){                        // 音声・動画用
      const buf=await res.arrayBuffer();
      const m=/bytes=(\d+)-(\d*)/.exec(range);
      const start=+m[1], end=m[2]?+m[2]:buf.byteLength-1;
      return new Response(buf.slice(start,end+1),{status:206,headers:{
        'Content-Type':res.headers.get('Content-Type'),
        'Content-Range':`bytes ${start}-${end}/${buf.byteLength}`,
        'Accept-Ranges':'bytes'}});
    }
    return res;
  })());
});
