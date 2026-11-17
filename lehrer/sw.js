// Free demo: no offline install. This replaces the old worker and removes itself.
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.registration.unregister()));
