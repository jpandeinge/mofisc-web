import React from 'react';
import App from './App';

// Smoke test: Just verify the App module can be imported
// Revolut approach: Don't test complex integrations in unit tests
test('App module imports without crashing', () => {
  expect(App).toBeDefined();
  expect(typeof App).toBe('function');
});
