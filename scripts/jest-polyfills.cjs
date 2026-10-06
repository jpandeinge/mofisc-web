const { TextEncoder, TextDecoder } = require('node:util');
Object.assign(globalThis, { TextEncoder, TextDecoder });

// Unit tests must not depend on a developer's real .env or live credentials.
Object.assign(process.env, {
  REACT_APP_API_URL: 'http://localhost:8000',
  REACT_APP_SUPABASE_URL: 'https://test.supabase.co',
  REACT_APP_SUPABASE_ANON_KEY: 'test-anon-key',
  REACT_APP_FIREBASE_API_KEY: 'test-firebase-key',
  REACT_APP_FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
  REACT_APP_FIREBASE_PROJECT_ID: 'test-project',
  REACT_APP_FIREBASE_APP_ID: 'test-app-id',
});
