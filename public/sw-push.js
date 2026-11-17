// Service Worker Push & Notification Handler — achenacidade (Alagoinhas - BA)

self.addEventListener('activate', (event) => {
  if (self.clients && typeof self.clients.claim === 'function') {
    event.waitUntil(self.clients.claim());
  }
});

self.addEventListener('push', (event) => {
  let payload = {
    title: 'Novidade no achenacidade',
    body: 'Uma de suas empresas favoritas em Alagoinhas publicou uma atualização.',
    icon: '/pwa-192x192.png',
    badge: '/pwa-maskable-512x512.png',
    tag: 'achenacidade-alerta',
    data: {
      url: '/',
      itemType: 'business',
    },
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      payload = {
        ...payload,
        ...parsed,
        data: {
          ...payload.data,
          ...(parsed.data || {}),
        },
      };
    } catch {
      const text = event.data.text();
      if (text) {
        payload.body = text;
      }
    }
  }

  const options = {
    body: payload.body,
    icon: payload.icon || '/pwa-192x192.png',
    badge: payload.badge || '/pwa-maskable-512x512.png',
    image: payload.image || undefined,
    tag: payload.tag || `achenacidade-${Date.now()}`,
    renotify: true,
    vibrate: [180, 90, 180],
    data: payload.data || { url: '/' },
    actions: [
      { action: 'open', title: 'Ver agora' },
      { action: 'dismiss', title: 'Dispensar' },
    ],
  };

  event.waitUntil(self.registration.showNotification(payload.title, options));
});

self.addEventListener('message', (event) => {
  if (!event.data || typeof event.data !== 'object') return;

  if (event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data.type === 'SHOW_PUSH_NOTIFICATION' && event.data.payload) {
    const payload = event.data.payload;
    const options = {
      body: payload.body || 'Nova atualização disponível em Alagoinhas.',
      icon: payload.icon || '/pwa-192x192.png',
      badge: payload.badge || '/pwa-maskable-512x512.png',
      image: payload.image || undefined,
      tag: payload.tag || `achenacidade-${Date.now()}`,
      renotify: true,
      vibrate: [180, 90, 180],
      data: payload.data || { url: '/' },
      actions: [
        { action: 'open', title: 'Ver detalhes' },
        { action: 'dismiss', title: 'Fechar' },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(payload.title || 'achenacidade Alagoinhas', options)
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  const data = event.notification.data || {};
  const targetUrl = data.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICKED',
            data,
          });
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    })
  );
});
