'use strict';

// Production static file server for the Mofisc web app.
// Replaces `serve` so we can set security headers on every response.
// Reads REACT_APP_API_URL at startup to build a tight CSP connect-src
// without hardcoding production origins.

const http = require('http');
const fs = require('fs');
const path = require('path');

const BUILD_DIR = path.resolve(__dirname, 'build');
const PORT = process.env.PORT || 8080;

// --- Content Security Policy ---
// Read API_URL (not REACT_APP_API_URL - that's build-time only)
const apiOrigin = (() => {
  try {
    const apiUrl = process.env.API_URL || process.env.REACT_APP_API_URL || '';
    if (!apiUrl) return '';
    return new URL(apiUrl).origin;
  } catch {
    return '';
  }
})();

const connectSources = [
  "'self'",
  apiOrigin,
  'https://api.mofisc.com',  // Production API (fallback if env var not set)
  'https://*.supabase.co',
  'wss://*.supabase.co',
  'https://*.supabase.io',
  'wss://*.supabase.io',
  'https://*.sentry.io',
  'https://*.googleapis.com',
  'https://*.firebaseapp.com',
  'https://*.firebase.com',
].filter(Boolean);

// Log CSP configuration on startup
if (require.main === module && !apiOrigin) {
  console.warn('WARNING: API_URL environment variable not set - CSP may block API calls');
  console.warn('   Set API_URL=https://api.mofisc.com (or your API domain)');
} else if (require.main === module) {
  console.log(`CSP configured to allow connections to: ${apiOrigin}`);
}

const CSP = [
  "default-src 'self'",
  "script-src 'self' https://www.gstatic.com https://static.cloudflareinsights.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "img-src 'self' data: blob:",
  `connect-src ${connectSources.join(' ')} https://cloudflareinsights.com`,
  "font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com data:",
  "worker-src 'self' blob:",
  "frame-src 'self'",
  "frame-ancestors 'none'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "manifest-src 'self'",
].join('; ');

// --- MIME types ---
const MIME = {
  '.html':  'text/html; charset=utf-8',
  '.css':   'text/css',
  '.js':    'application/javascript',
  '.json':  'application/json',
  '.png':   'image/png',
  '.jpg':   'image/jpeg',
  '.jpeg':  'image/jpeg',
  '.gif':   'image/gif',
  '.svg':   'image/svg+xml',
  '.ico':   'image/x-icon',
  '.woff':  'font/woff',
  '.woff2': 'font/woff2',
  '.ttf':   'font/ttf',
  '.map':   'application/json',
};

// --- Security headers on every response ---
const SECURITY_HEADERS = {
  'Content-Security-Policy':   CSP,
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options':    'nosniff',
  'X-Frame-Options':           'DENY',
  'Referrer-Policy':           'strict-origin-when-cross-origin',
  'Permissions-Policy':        'geolocation=(), microphone=(), camera=()',
};

// --- Request handler ---
function createServer(buildDir = BUILD_DIR) {
  const root = fs.realpathSync(buildDir);
  return http.createServer((req, res) => {
  Object.entries(SECURITY_HEADERS).forEach(([k, v]) => res.setHeader(k, v));
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  const fail = (status, message) => {
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(message);
  };
  if (!['GET', 'HEAD'].includes(req.method)) {
    res.setHeader('Allow', 'GET, HEAD');
    return fail(405, 'Method Not Allowed');
  }
  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    if (pathname.includes('\0') || pathname.includes('\\')) return fail(400, 'Bad Request');
  } catch {
    return fail(400, 'Bad Request');
  }
  // Reject dotfiles and decoded traversal, including sibling build directories.
  if (pathname.split('/').some(part => part.startsWith('.'))) return fail(403, 'Forbidden');
  let filePath = path.resolve(root, '.' + pathname);
  const outsideRoot = candidate => {
    const relative = path.relative(root, candidate);
    return relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative);
  };
  if (outsideRoot(filePath)) return fail(403, 'Forbidden');
  let stat;
  try {
    if (fs.statSync(filePath).isDirectory()) filePath = path.join(filePath, 'index.html');
    stat = fs.statSync(filePath);
  } catch {
    // Missing assets must not return HTML (or hide broken deployment paths).
    if (path.extname(pathname)) return fail(404, 'Not Found');
    filePath = path.join(root, 'index.html');
    try { stat = fs.statSync(filePath); } catch { return fail(404, 'Not Found'); }
  }
  if (!stat.isFile()) return fail(404, 'Not Found');
  try {
    if (outsideRoot(fs.realpathSync(filePath))) return fail(403, 'Forbidden');
  } catch { return fail(404, 'Not Found'); }

  res.setHeader('Content-Type', MIME[path.extname(filePath)] || 'application/octet-stream');
  res.setHeader('Content-Length', stat.size);
  // Only content-hashed assets are immutable. Workers/manifests must revalidate.
  if (/^\/static\/.+-[\w-]{8}\.[\w.]+$/.test(pathname)) {
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
  }
  if (req.method === 'HEAD') return res.end();
  fs.createReadStream(filePath).on('error', () => res.destroy()).pipe(res);
  });
}

module.exports = { createServer };
if (require.main === module) createServer().listen(PORT, () => {
  console.log(`Mofisc web app listening on port ${PORT}`);
  console.log(`CSP connect-src: ${connectSources.join(', ')}`);
});
