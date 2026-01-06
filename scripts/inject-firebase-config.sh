#!/bin/bash

# inject-firebase-config.sh
# Injects Firebase API key into service worker at build time
# This keeps the key out of git while making it available in the built app

echo "🔧 Injecting Firebase config into service worker..."

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "❌ Error: .env.local not found"
    echo "   Create .env.local with your Firebase API key"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env.local | xargs)

# Check if API key is set
if [ -z "$EXPO_PUBLIC_FIREBASE_API_KEY" ]; then
    echo "❌ Error: EXPO_PUBLIC_FIREBASE_API_KEY not set in .env.local"
    exit 1
fi

# Create a temporary service worker with the real API key
if [ -f "public/firebase-messaging-sw.js" ]; then
    # Replace the placeholder with the real API key
    sed "s/REPLACE_AT_BUILD_TIME/$EXPO_PUBLIC_FIREBASE_API_KEY/g" \
        public/firebase-messaging-sw.js > public/firebase-messaging-sw.tmp.js
    
    # Only update if sed was successful
    if [ $? -eq 0 ]; then
        mv public/firebase-messaging-sw.tmp.js public/firebase-messaging-sw.js
        echo "✅ Firebase config injected successfully"
    else
        echo "❌ Error injecting config"
        rm -f public/firebase-messaging-sw.tmp.js
        exit 1
    fi
else
    echo "⚠️  Warning: public/firebase-messaging-sw.js not found"
fi

echo "✅ Build configuration complete"
