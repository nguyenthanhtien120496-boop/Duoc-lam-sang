/*
 * Service worker: lưu đệm khung ứng dụng và tài liệu để dùng ngoại tuyến.
 * Tăng CACHE_VERSION mỗi khi đổi mã, dữ liệu hoặc tài liệu.
 * - Khung ứng dụng và tài liệu: cache-first (cập nhật khi đổi CACHE_VERSION).
 * - data/*.json: stale-while-revalidate.
 * - CDN (phông chữ, thư viện của tài liệu): lưu đệm khi đã tải một lần.
 */
var CACHE_VERSION = 'v1.0.0';
var APP_CACHE = 'cdss-app-' + CACHE_VERSION;
var CDN_CACHE = 'cdss-cdn-' + CACHE_VERSION;

var SHELL = [
  './', 'index.html', 'manifest.webmanifest', 'icons/icon.svg',
  'css/base.css', 'css/theme-san-nhi-qn.css',
  'js/lib/formulas.js', 'js/core.js', 'js/lib/calc-ui.js',
  'js/modules/home.js', 'js/modules/doc-viewer.js', 'js/modules/calc-crcl.js',
  'js/modules/calc-egfr.js', 'js/modules/calc-body.js', 'js/modules/about.js',
  'data/documents.json', 'data/formulas.json'
];
var CDN_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com', 'cdn.tailwindcss.com', 'cdnjs.cloudflare.com', 'cdn.jsdelivr.net', 'unpkg.com'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(APP_CACHE).then(function (cache) {
    return cache.addAll(SHELL).then(function () {
      // Tài liệu: lấy danh sách từ documents.json; tài liệu lỗi không làm hỏng cài đặt.
      return fetch('data/documents.json').then(function (r) { return r.json(); }).then(function (d) {
        return Promise.all(d.records.map(function (doc) {
          return cache.add(encodeURI(doc.file)).catch(function () { /* bỏ qua */ });
        }));
      }).catch(function () { /* bỏ qua */ });
    });
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) {
      return k.indexOf('cdss-') === 0 && k !== APP_CACHE && k !== CDN_CACHE;
    }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);

  if (url.origin === self.location.origin) {
    if (/\/data\/[^/]+\.json$/.test(url.pathname)) {
      e.respondWith(caches.open(APP_CACHE).then(function (cache) {
        return cache.match(req, { ignoreSearch: true }).then(function (hit) {
          var net = fetch(req).then(function (res) {
            if (res.ok) cache.put(req, res.clone());
            return res;
          }).catch(function () { return hit; });
          return hit || net;
        });
      }));
      return;
    }
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(function (hit) {
      return hit || fetch(req).then(function (res) {
        if (res.ok && res.type === 'basic') {
          var copy = res.clone();
          caches.open(APP_CACHE).then(function (c) { c.put(req, copy); });
        }
        return res;
      }).catch(function () {
        if (req.mode === 'navigate') return caches.match('index.html');
        return Response.error();
      });
    }));
    return;
  }

  if (CDN_HOSTS.indexOf(url.hostname) !== -1) {
    e.respondWith(caches.open(CDN_CACHE).then(function (cache) {
      return cache.match(req).then(function (hit) {
        return hit || fetch(req).then(function (res) {
          if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
          return res;
        });
      });
    }));
  }
});
