#!/bin/bash

# Security Remediation Script
# Removes hardcoded API keys from current codebase
# NOTE: This does NOT fix git history - use BFG for that

echo "🔒 Security Remediation: Removing Hardcoded API Keys"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: Must run from project root${NC}"
    exit 1
fi

echo -e "${YELLOW}⚠️  This script will:${NC}"
echo "   1. Remove hardcoded API keys from scripts"
echo "   2. Update firebase-messaging-sw.js to use placeholders"
echo "   3. Delete unnecessary migration scripts with keys"
echo ""
echo -e "${RED}⚠️  IMPORTANT: Rotate API keys in Google Cloud Console FIRST!${NC}"
echo ""
read -p "Have you rotated the API keys? (yes/no): " rotated

if [ "$rotated" != "yes" ]; then
    echo -e "${RED}Please rotate API keys first, then run this script${NC}"
    exit 1
fi

echo ""
echo "Starting cleanup..."
echo ""

# 1. Delete migration scripts (not needed anymore, contain keys)
echo "1. Removing migration scripts with hardcoded keys..."
if [ -f "scripts/archive/migration/setup-shared-auth.js" ]; then
    rm -f scripts/archive/migration/setup-shared-auth.js
    echo "   ✓ Deleted setup-shared-auth.js"
fi

if [ -f "scripts/archive/migration/add-pin-fields.js" ]; then
    rm -f scripts/archive/migration/add-pin-fields.js
    echo "   ✓ Deleted add-pin-fields.js"
fi

# 2. Update create-test-notification.js to use env vars
echo ""
echo "2. Updating create-test-notification.js..."
if [ -f "scripts/create-test-notification.js" ]; then
    # Replace hardcoded key with env var
    sed -i.bak 's/apiKey: "AIza[^"]*"/apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY/g' scripts/create-test-notification.js
    rm -f scripts/create-test-notification.js.bak
    echo "   ✓ Updated to use environment variable"
fi

# 3. Update firebase-messaging-sw.js
echo ""
echo "3. Updating firebase-messaging-sw.js..."
if [ -f "public/firebase-messaging-sw.js" ]; then
    cat > public/firebase-messaging-sw.js << 'EOF'
// Firebase Cloud Messaging Service Worker
// Sia Moon Property Management Staff App

console.log('🚀 Loading Firebase service worker for Sia Moon Staff App');

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js');

self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  console.log('✅ Service Worker: Activated');
  event.waitUntil(self.clients.claim());
});

// Firebase config is injected at build time from environment variables
// See: app.json or build configuration
firebase.initializeApp({
  apiKey: "FIREBASE_API_KEY_INJECTED_AT_BUILD",
  authDomain: "operty-b54dc.firebaseapp.com",
  databaseURL: "https://operty-b54dc-default-rtdb.firebaseio.com",
  projectId: "operty-b54dc",
  storageBucket: "operty-b54dc.firebasestorage.app",
  messagingSenderId: "794479687167",
  appId: "1:794479687167:web:edd19f3b6c44d89c4c9b4a",
  measurementId: "G-HNLQZJLQZR"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('🔔 Firebase: Background message received:', payload);

  const notificationTitle = payload.notification?.title || 'Sia Moon Staff';
  const notificationOptions = {
    body: payload.notification?.body || 'New notification',
    icon: '/assets/icon.png',
    badge: '/assets/icon.png',
    tag: payload.data?.tag || 'default',
    data: payload.data || {},
    actions: []
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ Notification clicked:', event.notification);
  event.notification.close();

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes('/(tabs)') && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/(tabs)');
      }
    })
  );
});

console.log('✅ Service Worker: Ready for push notifications');
EOF
    echo "   ✓ Updated with placeholder (requires build-time injection)"
fi

echo ""
echo -e "${GREEN}✅ Cleanup complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Verify .env.local has your NEW API keys"
echo "2. Test that the app still works"
echo "3. Commit these changes"
echo "4. Use BFG Repo-Cleaner to remove keys from git history"
echo ""
echo "For git history cleanup, see SECURITY_ALERT_API_KEYS_EXPOSED.md"
