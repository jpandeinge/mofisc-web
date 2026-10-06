// src/config/firebase.ts
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, Messaging } from 'firebase/messaging';
import {
  secureLogger,
  logNotificationPermission,
  logFCMToken,
  logServiceWorkerRegistration
} from '../utils/secureLogger';

// Firebase configuration from environment variables
const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID
};

// Initialize Firebase only if config is valid
let app: any = null;
let messaging: Messaging | null = null;

try {
  // Check if Firebase config is valid
  if (firebaseConfig.apiKey && firebaseConfig.projectId) {
    app = initializeApp(firebaseConfig);

    // Only initialize messaging if supported
    if ('Notification' in window && 'serviceWorker' in navigator) {
      messaging = getMessaging(app);
    }
  } else {
    secureLogger.warn('Firebase', 'Configuration incomplete - push notifications disabled');
  }
} catch (error) {
  secureLogger.warn('Firebase', 'Initialization failed - push notifications disabled', error);
}

export { app, messaging };

/**
 * Request notification permission and get FCM token.
 * Only requests permission if not already granted (to avoid browser violation warnings).
 */
export const requestNotificationPermission = async (): Promise<string | null> => {
  try {
    if (!messaging) {
      secureLogger.warn('Firebase', 'Messaging not initialized - push notifications unavailable');
      return null;
    }

    // Check if service worker is available
    if (!('serviceWorker' in navigator)) {
      secureLogger.warn('Firebase', 'Service Worker not supported - push notifications unavailable');
      return null;
    }

    // Check current permission status first (doesn't require user gesture)
    const currentPermission = Notification.permission;

    // If already denied, don't request again
    if (currentPermission === 'denied') {
      secureLogger.info('Firebase', 'Notification permission previously denied');
      return null;
    }

    // If already granted, proceed to get token without requesting
    // If 'default', we need to request - but this will show browser warning if not from user gesture
    // To avoid the warning, we only request if permission is 'default' AND we're likely in a user gesture context
    let permission: NotificationPermission = currentPermission;
    if (currentPermission === 'default') {
      // Request permission - this may show browser warning if not from user gesture
      // The caller should ideally only call this after a user action (e.g., clicking "Enable notifications")
      permission = await Notification.requestPermission();
    }

    if (permission === 'granted') {
      logNotificationPermission('Firebase', true);

      try {
        // Register service worker explicitly
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
        logServiceWorkerRegistration('Firebase', true);

        const vapidKey = process.env.REACT_APP_FIREBASE_VAPID_KEY;
        if (!vapidKey) {
          secureLogger.warn('Firebase', 'VAPID key missing - push notifications unavailable');
          return null;
        }

        // Get FCM token
        // VAPID key should be generated in Firebase Console -> Project Settings -> Cloud Messaging -> Web Push certificates
        const token = await getToken(messaging, {
          vapidKey,
          serviceWorkerRegistration: registration
        });

        if (token) {
          // CRITICAL SECURITY: Never log the actual token
          logFCMToken('Firebase', true);
          return token;
        } else {
          logFCMToken('Firebase', false);
          return null;
        }
      } catch (tokenError: any) {
        // Handle specific service worker errors gracefully
        if (tokenError.message?.includes('service worker') ||
            tokenError.message?.includes('Service Worker') ||
            tokenError.code === 'messaging/failed-service-worker-registration') {
          secureLogger.warn('Firebase', 'Push notifications unavailable - service worker issue');
          return null;
        }
        throw tokenError;
      }
    } else {
      logNotificationPermission('Firebase', false);
      return null;
    }
  } catch (error) {
    secureLogger.warn('Firebase', 'Error getting notification permission - continuing without push notifications', error);
    return null;
  }
};

/**
 * Listen for foreground messages
 */
export const subscribeToMessages = (handler: (payload: any) => void): (() => void) => {
  if (!messaging) {
    secureLogger.error('Firebase', 'Messaging not initialized - cannot listen for messages');
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    secureLogger.info('Firebase', 'Message received in foreground');
    handler(payload);
  });
};
