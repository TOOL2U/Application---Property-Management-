// Service Worker for Push Notifications
// Sia Moon Property Management Staff App

const CACHE_NAME = 'sia-moon-staff-v1';

// Install event
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated');
  event.waitUntil(self.clients.claim());
});

// Push event handler
self.addEventListener('push', (event) => {
  console.log('📱 Service Worker: Push event received', event);
  
  if (!event.data) {
    console.log('❌ Service Worker: No push data received');
    return;
  }

  try {
    const data = event.data.json();
    console.log('📋 Service Worker: Push data:', data);

    const options = {
      body: data.body || 'New notification',
      icon: '/assets/icon.png',
      badge: '/assets/icon.png',
      tag: data.tag || 'default',
      data: data.data || {},
      actions: data.actions || [],
      requireInteraction: data.requireInteraction || false,
      silent: data.silent || false,
      vibrate: data.vibrate || [200, 100, 200],
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'Sia Moon Staff',
        options
      )
    );
  } catch (error) {
    console.error('❌ Service Worker: Error processing push event:', error);
    
    // Fallback notification
    event.waitUntil(
      self.registration.showNotification('Sia Moon Staff', {
        body: 'New notification received',
        icon: '/assets/icon.png',
        tag: 'fallback'
      })
    );
  }
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Service Worker: Notification clicked', event);
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            if (urlToOpen !== '/') {
              client.navigate(urlToOpen);
            }
            return;
          }
        }
        
        // Open new window if app is not open
        if (self.clients.openWindow) {
          return self.clients.openWindow(urlToOpen);
        }
      })
  );
});

// Background sync (for offline functionality)
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'job-status-sync') {
    event.waitUntil(syncJobStatus());
  }
});

// Sync job status when back online
async function syncJobStatus() {
  try {
    console.log('🔄 Service Worker: Syncing job status...');
    // This would typically sync with your backend
    // For now, just log the sync attempt
    console.log('✅ Service Worker: Job status sync completed');
  } catch (error) {
    console.error('❌ Service Worker: Job status sync failed:', error);
  }
}

// Handle fetch events (for caching if needed)
self.addEventListener('fetch', (event) => {
  // Only handle GET requests for now
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Basic caching strategy for static assets
  if (event.request.url.includes('/assets/') || 
      event.request.url.includes('.js') || 
      event.request.url.includes('.css')) {
    
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          if (response) {
            return response;
          }
          
          return fetch(event.request)
            .then((response) => {
              if (!response || response.status !== 200 || response.type !== 'basic') {
                return response;
              }

              const responseToCache = response.clone();
              caches.open(CACHE_NAME)
                .then((cache) => {
                  cache.put(event.request, responseToCache);
                });

              return response;
            });
        })
    );
  }
});

console.log('🚀 Service Worker: Loaded and ready for Sia Moon Staff App');
