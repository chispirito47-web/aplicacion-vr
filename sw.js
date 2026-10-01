// Service Worker — Casa Dams RA offline cache
// Sube la versión (v2, v3...) cuando cambies los archivos precacheados para forzar una recarga.
const CACHE_NAME = 'casadams-ra-v5';

const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/webxr/ARButton.js',
  'https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/loaders/GLTFLoader.js',
  // Modelos 3D (.glb) de los 14 muebles del catálogo
  'https://cdn.shopify.com/3d/models/o/aa81cb1246358eb0/silla_comedor_splendor.glb',
  'https://cdn.shopify.com/3d/models/o/48cdabd4155fe5e0/comedor_vera.glb',
  'https://cdn.shopify.com/3d/models/o/f7f4e50cd23831be/sala_divan_model.glb',
  'https://cdn.shopify.com/3d/models/o/5dc0999e90c04ae5/sala-japandi-3d.glb',
  'https://cdn.shopify.com/3d/models/o/d83fc8c5d570a1a5/comedor-escandinava-3d.glb',
  'https://cdn.shopify.com/3d/models/o/35b295f195c5a959/comedor_kyoto.glb',
  'https://cdn.shopify.com/3d/models/o/843cbd0c06024244/comedor_trebol_natural.glb',
  'https://cdn.shopify.com/3d/models/o/4c1674432025332d/comedor_montana_plus.glb',
  'https://cdn.shopify.com/3d/models/o/e9ed54f03d0dbe94/comedor_caprini.glb',
  'https://cdn.shopify.com/3d/models/o/026a3d7bf3ddb773/sala_alaska_model.glb',
  'https://cdn.shopify.com/3d/models/o/07a339775c312ed0/silla_comedor_danesa.glb',
  'https://cdn.shopify.com/3d/models/o/e035887527909ced/silla_comedor_dunda_redondo.glb',
  'https://cdn.shopify.com/3d/models/o/ffa75dbf55478339/silla_escandinava.glb',
  'https://cdn.shopify.com/3d/models/o/20c6340ba48bcc1d/silla_comedor_marmol.glb',
  'https://cdn.shopify.com/3d/models/o/3cee3c64a301b694/comedor_maria_palito_natura.glb',
  'https://cdn.shopify.com/3d/models/o/05a0115714f7ea69/sala_yemen.glb'
];

// Orígenes que podemos cachear en tiempo real si aparece algo nuevo (ej. un chunk interno de three.js)
const RUNTIME_CACHE_ORIGINS = ['cdn.jsdelivr.net', 'cdn.shopify.com'];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return Promise.allSettled(
        PRECACHE_URLS.map(function(url){
          return fetch(url, { mode: 'cors' }).then(function(res){
            if (res && (res.ok || res.type === 'opaque')) {
              return cache.put(url, res);
            }
          }).catch(function(){ /* sin internet en la instalación, seguimos con lo que sí haya */ });
        })
      );
    }).then(function(){ return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(k){ return k !== CACHE_NAME; }).map(function(k){ return caches.delete(k); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(event){
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isRuntimeOrigin = RUNTIME_CACHE_ORIGINS.indexOf(url.hostname) !== -1;
  if (!isSameOrigin && !isRuntimeOrigin) return; // deja pasar todo lo demás sin tocar

  event.respondWith(
    caches.match(req).then(function(cached){
      if (cached) return cached;
      return fetch(req, { mode: isSameOrigin ? 'same-origin' : 'cors' }).then(function(res){
        if (res && (res.ok || res.type === 'opaque')) {
          const resClone = res.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(req, resClone); });
        }
        return res;
      }).catch(function(){
        if (req.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
