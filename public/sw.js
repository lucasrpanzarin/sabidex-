// Sabidex: guarda o app e os áudios para funcionar sem internet.
const CACHE = 'sabidex-v1';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  // Páginas: tenta a internet primeiro (para pegar atualizações), senão usa a cópia salva.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(CACHE).then((k) => k.put('./', c)); return r; }).catch(() => caches.match('./')));
    return;
  }
  // Arquivos do app, fontes e áudios: usa a cópia salva e atualiza por trás.
  if (url.origin === location.origin) {
    e.respondWith(caches.open(CACHE).then(async (k) => {
      const salvo = await k.match(req);
      const rede = fetch(req).then((r) => { if (r.ok) k.put(req, r.clone()); return r; }).catch(() => salvo);
      return salvo || rede;
    }));
  }
});
