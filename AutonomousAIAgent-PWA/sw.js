// Service Worker for Autonomous AI Agent PWA
const CACHE_NAME = 'autonomous-ai-agent-v1.0.0';
const urlsToCache = [
  '/',
  '/index.html',
  '/app.js',
  '/manifest.json',
  'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><text y=\'.9em\' font-size=\'90\'>🤖</text></svg>'
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
      .then(() => {
        console.log('All resources cached');
        return self.skipWaiting();
      })
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker activated');
      return self.clients.claim();
    })
  );
});

// Fetch event - Cache-first strategy for static assets, network-first for API calls
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle API calls (network-first)
  if (url.hostname === 'api.anthropic.com') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone the response since it can only be consumed once
          const responseClone = response.clone();
          
          // Cache successful API responses for offline fallback
          if (response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return offline message if no cache available
            return new Response(
              JSON.stringify({
                error: 'Network unavailable. Please check your connection.',
                offline: true
              }),
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: { 'Content-Type': 'application/json' }
              }
            );
          });
        })
    );
    return;
  }

  // Handle app assets (cache-first)
  event.respondWith(
    caches.match(request)
      .then((response) => {
        // Return cached version if available
        if (response) {
          return response;
        }

        // Fetch from network if not in cache
        return fetch(request).then((response) => {
          // Don't cache non-successful responses
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response since it can only be consumed once
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(request, responseToCache);
            });

          return response;
        });
      })
      .catch(() => {
        // Fallback for HTML requests when offline
        if (request.destination === 'document') {
          return caches.match('/index.html');
        }
        
        // Return a generic offline response for other requests
        return new Response(
          'App is offline. Please check your connection.',
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' }
          }
        );
      })
  );
});

// Handle background sync for offline message sending
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync-messages') {
    event.waitUntil(syncMessages());
  }
});

// Handle push notifications (for future use)
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body || 'New message from your AI agent',
      icon: 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><text y=\'.9em\' font-size=\'90\'>🤖</text></svg>',
      badge: 'data:image/svg+xml,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'><text y=\'.9em\' font-size=\'90\'>🤖</text></svg>',
      tag: 'ai-agent-notification',
      renotify: true,
      actions: [
        {
          action: 'open',
          title: 'Open Chat'
        },
        {
          action: 'dismiss',
          title: 'Dismiss'
        }
      ]
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Autonomous AI Agent', options)
    );
  }
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients.matchAll({ type: 'window' }).then((clientList) => {
        // If app is already open, focus it
        for (let client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            return client.focus();
          }
        }
        
        // Otherwise open new window
        if (clients.openWindow) {
          return clients.openWindow('/');
        }
      })
    );
  }
});

// Background sync function for offline message queue
async function syncMessages() {
  try {
    // Get offline messages from IndexedDB or localStorage
    const offlineMessages = await getOfflineMessages();
    
    for (const message of offlineMessages) {
      try {
        // Attempt to send the message
        await sendMessage(message);
        
        // Remove from offline queue if successful
        await removeOfflineMessage(message.id);
        
        console.log('Synced offline message:', message.id);
      } catch (error) {
        console.error('Failed to sync message:', message.id, error);
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Helper functions for offline message handling
async function getOfflineMessages() {
  // In a real implementation, you'd use IndexedDB
  // For now, return empty array
  return [];
}

async function removeOfflineMessage(messageId) {
  // Remove message from offline storage
  console.log('Removing offline message:', messageId);
}

async function sendMessage(message) {
  // Send message to API
  console.log('Sending message:', message);
}

// Handle app updates
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Periodic background sync (for future use)
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'ai-agent-sync') {
    event.waitUntil(
      // Perform periodic tasks like checking for new features
      performPeriodicSync()
    );
  }
});

async function performPeriodicSync() {
  console.log('Performing periodic sync...');
  // Could check for app updates, sync user preferences, etc.
}

// Log all console messages for debugging
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
});

console.log('Service Worker loaded successfully');