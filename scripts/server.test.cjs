const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const http = require('node:http');
const { createServer } = require('../server');

const fixture = fs.mkdtempSync(path.join(os.tmpdir(), 'galahad-server-test-'));
let server;
before(async () => {
  fs.mkdirSync(path.join(fixture, 'static'));
  fs.writeFileSync(path.join(fixture, 'index.html'), '<div>app</div>');
  fs.writeFileSync(path.join(fixture, 'firebase-messaging-sw.js'), '// worker');
  fs.writeFileSync(path.join(fixture, 'static/app-AbCd1234.js'), '// hashed');
  server = createServer(fixture);
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
});
after(async () => {
  if (server) await new Promise(resolve => server.close(resolve));
  fs.rmSync(fixture, { recursive: true });
});
function request(url, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = http.request({ host: '127.0.0.1', port: server.address().port, path: url, method }, res => {
      let body = '';
      res.on('data', chunk => { body += chunk; });
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body }));
    });
    req.on('error', reject);
    req.end();
  });
}
test('SPA deep links work, missing assets stay 404', async () => {
  assert.match((await request('/app/settings')).body, /app/);
  assert.equal((await request('/static/missing.js')).status, 404);
});
test('malformed URLs and traversal fail safely with security headers', async () => {
  for (const url of ['/%', '/%00', '/%2e%2e%2fsecret', '/.env', '/%5c..%5csecret']) {
    const response = await request(url);
    assert.ok([400, 403].includes(response.status), url);
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
  }
  assert.equal((await request('/')).status, 200);
});
test('only content-hashed assets are cached immutably', async () => {
  assert.match((await request('/static/app-AbCd1234.js')).headers['cache-control'], /immutable/);
  for (const url of ['/', '/firebase-messaging-sw.js']) {
    assert.match((await request(url)).headers['cache-control'], /no-cache/);
  }
});
test('HEAD works without a body and writes are rejected', async () => {
  assert.equal((await request('/', 'HEAD')).body, '');
  assert.equal((await request('/', 'POST')).status, 405);
});
