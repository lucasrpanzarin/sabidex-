// Sabidex: guarda o app e os áudios para funcionar sem internet.
// Mudou a versão (v3): apaga as cópias antigas, que podiam ter guardado a página do app
// no lugar de um áudio que ainda não existia (aí tocava a voz antiga).
const CACHE = 'sabidex-v3';
self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

// Só guarda resposta completa (200) e do tipo certo: nunca a página do app no lugar de um arquivo.
function podeGuardar(url, r) {
  if (r.status !== 200) return false;
  const tipo = r.headers.get('content-type') || '';
  if (/\.mp3$/i.test(url.pathname)) return tipo.startsWith('audio/');
  if (/\.[a-z0-9]+$/i.test(url.pathname) && !/\.html$/i.test(url.pathname)) return !tipo.includes('text/html');
  return true;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Servidor (turma, trocas, ranking): sempre direto da internet, nunca da cópia salva.
  if (url.pathname.startsWith('/api/')) return;
  // Páginas: tenta a internet primeiro (para pegar atualizações), senão usa a cópia salva.
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { const c = r.clone(); caches.open(CACHE).then((k) => k.put('./', c)); return r; }).catch(() => caches.match('./')));
    return;
  }
  // Áudios: internet primeiro (o celular pede o áudio em pedaços), cópia salva só sem internet.
  // A cópia é baixada inteira, à parte, para tocar depois mesmo offline.
  if (/\.mp3$/i.test(url.pathname)) {
    e.respondWith(fetch(req).then((r) => {
      if (r.ok) caches.open(CACHE).then(async (k) => {
        if (await k.match(url.href)) return;
        const inteiro = await fetch(url.href);
        if (podeGuardar(url, inteiro)) await k.put(url.href, inteiro);
      }).catch(() => {});
      return r;
    }).catch(async () => (await caches.match(url.href)) || Response.error()));
    return;
  }
  // Arquivos do app e fontes: usa a cópia salva e atualiza por trás.
  e.respondWith(caches.open(CACHE).then(async (k) => {
    const salvo = await k.match(req);
    const rede = fetch(req).then((r) => { if (podeGuardar(url, r)) k.put(req, r.clone()); return r; }).catch(() => salvo || Response.error());
    return salvo || rede;
  }));
});
