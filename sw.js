// sw.js - Service Worker para Amy Nails 

const CACHE_NAME = 'amynails_-v4';
const urlsToCache = [
  '/amynails_/',
  '/amynails_/index.html',
  '/amynails_/admin.html',
  '/amynails_/admin-login.html',
  '/amynails_/calendar.html',
  '/amynails_/setup-wizard.html',
  '/amynails_/editar-negocio.html',
  '/amynails_/manifest.json',
  '/amynails_/icons/icon-72x72.png',
  '/amynails_/icons/icon-96x96.png',
  '/amynails_/icons/icon-128x128.png',
  '/amynails_/icons/icon-144x144.png',
  '/amynails_/icons/icon-152x152.png',
  '/amynails_/icons/icon-192x192.png',
  '/amynails_/icons/icon-384x384.png',
  '/amynails_/icons/icon-512x512.png'
];

// ============================================
// INSTALACIÃ“N
// ============================================
self.addEventListener('install', event => {
  console.log('ðŸ“¦ Service Worker instalando...');
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('âœ… Cache creado, guardando archivos...');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('âŒ Error al cachear archivos:', error);
      })
  );
});

// ============================================
// ACTIVACIÃ“N
// ============================================
self.addEventListener('activate', event => {
  console.log('ðŸ”„ Service Worker activado, limpiando caches antiguos...');
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log('ðŸ—‘ï¸ Eliminando cache antiguo:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('âœ… Service Worker activado y listo');
      return self.clients.claim();
    })
  );
});

// ============================================
// ESTRATEGIA DE CACHÃ‰
// ============================================
self.addEventListener('fetch', event => {
  // Ignorar peticiones que no sean HTTP
  if (!event.request.url.startsWith('http')) return;
  
  // âš¡ NO INTERCEPTAR WHATSAPP (ESENCIAL PARA iOS)
  if (event.request.url.includes('wa.me') || 
      event.request.url.includes('api.whatsapp.com') ||
      event.request.url.includes('whatsapp.com')) {
    console.log('ðŸ“± Dejando pasar WhatsApp sin cache');
    return;
  }
  
  // Ignorar otras APIs externas
  if (event.request.url.includes('supabase.co')) return;
  if (event.request.url.includes('ntfy.sh')) return;
  if (event.request.url.includes('unsplash.com')) return;
  if (event.request.url.includes('cdn.') || 
      event.request.url.includes('unpkg.com') || 
      event.request.url.includes('trickle.so')) {
    return;
  }

  // Estrategia: Network First, fallback a cache
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Si la respuesta es vÃ¡lida, guardar en cache
        if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Si falla la red, buscar en cache
        return caches.match(event.request).then(cachedResponse => {
          if (cachedResponse) {
            console.log('ðŸ“¦ Sirviendo desde cache:', event.request.url);
            return cachedResponse;
          }
          // Si no hay cache y es imagen, devolver icon por defecto
          if (event.request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/)) {
            return caches.match('/amynails_/icons/icon-192x192.png');
          }
          return new Response('Error de red', { status: 408 });
        });
      })
  );
});

// ============================================
// MANEJO DE MENSAJES
// ============================================
self.addEventListener('message', event => {
  console.log('ðŸ“¨ Mensaje recibido:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('â© Saltando waiting...');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    console.log('ðŸ§¹ Limpiando todo el cache...');
    caches.keys().then(cacheNames => {
      cacheNames.forEach(cacheName => {
        caches.delete(cacheName);
        console.log('ðŸ—‘ï¸ Cache eliminado:', cacheName);
      });
    });
  }
});

console.log('âœ… Service Worker configurado para Amy Nails ');
console.log('ðŸ“¦ Cache:', CACHE_NAME);
console.log('ðŸ“„ Archivos a cachear:', urlsToCache.length);
