const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const { renderServiceWorker } = require('./generate-sw');

test('worker uses the installed Firebase release', () => {
  const source = renderServiceWorker({ apiKey: '' });
  assert.ok(source.includes(`/firebasejs/${require('firebase/package.json').version}/`));
  assert.ok(!source.includes('/firebasejs/9.0.0/'));
});
test('notification clicks only open URLs on the app origin', async () => {
  for (const target of ['/app/settings', 'https://evil.example/phish', '//evil.example', 'javascript:alert(1)', 'https://[invalid']) {
    let click, opened, pending;
    vm.runInNewContext(renderServiceWorker({ apiKey: '' }), {
      URL, importScripts() {}, console: { warn() {} },
      self: { location: { origin: 'https://app.example' }, addEventListener: (_, handler) => { click = handler; } },
      clients: { matchAll: async () => [], openWindow: async url => { opened = url; } },
    });
    click({ notification: { close() {}, data: { action_url: target } }, waitUntil: promise => { pending = promise; } });
    await pending;
    assert.equal(opened, target.startsWith('/app/') ? 'https://app.example' + target : 'https://app.example/');
  }
});
