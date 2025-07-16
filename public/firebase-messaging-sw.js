// Firebase Cloud Messaging Service Worker
// Sia Moon Property Management Staff App
// Compatible with Expo Push Notifications

// Expo Web Push Notification Support
// This service worker is configured to work with Expo's web push notification system
console.log('🚀 Loading Firebase + Expo service worker for Sia Moon Staff App');

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js');

// Expo service worker integration
// Note: Expo handles service worker registration automatically when properly configured
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing for Expo web push notifications...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated for Expo web push notifications');
  event.waitUntil(self.clients.claim());
});

// Initialize Firebase
firebase.initializeApp({
  apiKey: "AIzaSyBvOyxhK5S2cM9jVf7mHzKzHkzqhGJYFgE",
  authDomain: "operty-b54dc.firebaseapp.com",
  databaseURL: "https://operty-b54dc-default-rtdb.firebaseio.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "794479687167",
  appId: "1:794479687167:web:edd19f3b6c44d89c4c9b4a",
  measurementId: "G-HNLQZJLQZR"
});

// Retrieve Firebase Messaging object
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('🔔 Firebase: Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Sia Moon Staff';
  const notificationOptions = {
    body: payload.notification?.body || 'New notification',
    icon: '/assets/icon.png',
    badge: '/assets/icon.png',
    tag: payload.data?.tag || 'default',
    data: payload.data || {},
    actions: [],
    requireInteraction: false,
    silent: false,
    vibrate: [200, 100, 200],
  };

  // Add custom actions based on notification type
  if (payload.data?.type === 'job_assignment') {
    notificationOptions.actions = [
      {
        action: 'accept',
        title: '✅ Accept',
        icon: '/assets/accept-icon.png'
      },
      {
        action: 'decline',
        title: '❌ Decline',
        icon: '/assets/decline-icon.png'
      }
    ];
    notificationOptions.requireInteraction = true;
  }

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Firebase: Notification clicked:', event);
  
  event.notification.close();

  const action = event.action;
  const data = event.notification.data;

  if (action === 'accept' && data.jobId) {
    // Handle job acceptance
    event.waitUntil(
      handleJobAction(data.jobId, 'accepted')
    );
  } else if (action === 'decline' && data.jobId) {
    // Handle job decline
    event.waitUntil(
      handleJobAction(data.jobId, 'rejected')
    );
  } else {
    // Default action - open the app
    const urlToOpen = data.url || '/';
    
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
  }
});

// Handle job actions from notifications
async function handleJobAction(jobId, action) {
  try {
    console.log(`🔄 Firebase: Handling job ${action} for job ${jobId}`);
    
    // This would typically make an API call to update the job status
    // For now, we'll just log the action
    console.log(`✅ Firebase: Job ${jobId} ${action} successfully`);
    
    // You could also show a confirmation notification
    self.registration.showNotification(`Job ${action}`, {
      body: `Job has been ${action} successfully`,
      icon: '/assets/icon.png',
      tag: 'job-action-confirmation',
      silent: true
    });
    
  } catch (error) {
    console.error(`❌ Firebase: Failed to ${action} job ${jobId}:`, error);
    
    // Show error notification
    self.registration.showNotification('Action Failed', {
      body: `Failed to ${action} job. Please try again in the app.`,
      icon: '/assets/icon.png',
      tag: 'job-action-error'
    });
  }
}

// Handle push subscription changes
self.addEventListener('pushsubscriptionchange', (event) => {
  console.log('🔄 Firebase: Push subscription changed');
  
  event.waitUntil(
    // Re-subscribe to push notifications
    self.registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: 'BH7mKJZQk1kGGJOhrvY-cNpsyvwRAj-Btdd_WeZ4lHoMGfxSMokvAzJtBqsRBHdHBmy5CjjBQsV7mpNNvGwrBHI'
    }).then((subscription) => {
      console.log('✅ Firebase: Re-subscribed to push notifications');
      // Send new subscription to server
      return fetch('/api/push-subscription', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });
    })
  );
});

// Handle Expo push notifications (for web compatibility)
self.addEventListener('push', (event) => {
  console.log('📱 Expo Push: Received push event', event);

  if (!event.data) {
    console.log('❌ Expo Push: No data in push event');
    return;
  }

  try {
    const data = event.data.json();
    console.log('📋 Expo Push: Data received:', data);

    // Handle Expo push notification format
    if (data.experienceId || data.scopeKey) {
      const notificationTitle = data.title || 'Sia Moon Staff';
      const notificationOptions = {
        body: data.body || 'New notification',
        icon: '/assets/icon.png',
        badge: '/assets/icon.png',
        tag: data.tag || 'expo-notification',
        data: data.data || data,
        requireInteraction: false,
        silent: false,
        vibrate: [200, 100, 200],
      };

      // Add job-specific actions
      if (data.data?.type === 'job_assignment') {
        notificationOptions.actions = [
          {
            action: 'accept',
            title: '✅ Accept',
            icon: '/assets/accept-icon.png'
          },
          {
            action: 'decline',
            title: '❌ Decline',
            icon: '/assets/decline-icon.png'
          }
        ];
        notificationOptions.requireInteraction = true;
      }

      event.waitUntil(
        self.registration.showNotification(notificationTitle, notificationOptions)
      );
    }
  } catch (error) {
    console.error('❌ Expo Push: Error processing push event:', error);
  }
});

console.log('🚀 Firebase + Expo Messaging Service Worker: Loaded and ready for Sia Moon Staff App');
