// src/utils/fingerprint.ts
// Generates a stable device fingerprint from browser/system properties

const CLIENT_DEVICE_ID_STORAGE_KEY = 'mofisc_client_device_id_v1';

const hashString = async (str: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
};

const generateClientDeviceId = (): string => {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `client_${hex}`;
};

const getOrCreateClientDeviceId = (): string => {
  try {
    const existing = window.localStorage.getItem(CLIENT_DEVICE_ID_STORAGE_KEY);
    if (existing && existing.startsWith('client_') && existing.length >= 20) {
      return existing;
    }
    const created = generateClientDeviceId();
    window.localStorage.setItem(CLIENT_DEVICE_ID_STORAGE_KEY, created);
    return created;
  } catch {
    // If storage is unavailable (private mode, restricted browser), use ephemeral id.
    return generateClientDeviceId();
  }
};

const getCanvasFingerprint = (): string => {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 50;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  ctx.textBaseline = 'top';
  ctx.font = '14px, Arial';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#f68df8';
  ctx.fillRect(100, 1, 60, 20);
  ctx.fillStyle = '#009f8d';
  ctx.fillText('Galahad Security', 2, 17);
  ctx.fillStyle = 'rgba(102, 204, 170, 0.2)';
  ctx.fillRect(100, 1, 60, 20);

  return canvas.toDataURL();
};

const getAudioFingerprint = (): string => {
  // Skip AudioContext fingerprinting - it requires user gesture in modern browsers
  // and causes console warnings. We still have enough entropy from other sources.
  // Return static audio capability info instead.
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return 'no-audio';

    // Just check for audio support without creating context (avoids user gesture requirement)
    return `audio-supported-${navigator.maxTouchPoints || 0}`;
  } catch {
    return 'audio-error';
  }
};

export interface DeviceFingerprint {
  fingerprint: string;
  browser: string;
  os: string;
  userAgent: string;
  clientDeviceId: string;
}

export const generateFingerprint = async (): Promise<DeviceFingerprint> => {
  const clientDeviceId = getOrCreateClientDeviceId();
  const components = [
    navigator.userAgent,
    navigator.language,
    navigator.languages?.join(',') || '',
    String(window.screen.width),
    String(window.screen.height),
    String(window.screen.colorDepth),
    String(new Date().getTimezoneOffset()),
    getCanvasFingerprint(),
    getAudioFingerprint(),
    String(navigator.hardwareConcurrency || 0),
    String((navigator as any).deviceMemory || 0),
    navigator.platform,
    navigator.cookieEnabled ? 'cookies-on' : 'cookies-off',
    String(window.screen.availWidth),
    String(window.screen.availHeight),
    clientDeviceId,
  ];

  const fingerprint = await hashString(components.join('|'));
  const browser = detectBrowser();
  const os = detectOS();

  return {
    fingerprint,
    browser,
    os,
    userAgent: navigator.userAgent,
    clientDeviceId,
  };
};

/**
 * Detect browser name without version number.
 * Returns clean names like "Chrome", "Safari", "Firefox".
 */
const detectBrowser = (): string => {
  const ua = navigator.userAgent;

  // Order matters - check more specific browsers first
  if (ua.includes('Edg/')) return 'Edge';
  if (ua.includes('OPR/') || ua.includes('Opera')) return 'Opera';
  if (ua.includes('Brave')) return 'Brave';
  if (ua.includes('Vivaldi')) return 'Vivaldi';
  if (ua.includes('Firefox/')) return 'Firefox';
  if (ua.includes('Chrome/') && !ua.includes('Edg/') && !ua.includes('OPR/')) return 'Chrome';
  if (ua.includes('Safari/') && !ua.includes('Chrome/')) return 'Safari';
  if (ua.includes('MSIE') || ua.includes('Trident/')) return 'Internet Explorer';

  return 'Unknown Browser';
};

/**
 * Detect OS name without version number.
 * Returns clean, user-friendly names like "Mac", "Windows", "iPhone".
 */
const detectOS = (): string => {
  const ua = navigator.userAgent;

  // Mobile detection first
  if (ua.includes('iPhone')) return 'iPhone';
  if (ua.includes('iPad')) return 'iPad';
  if (ua.includes('Android')) return 'Android';

  // Desktop detection
  if (ua.includes('Windows NT')) return 'Windows';
  if (ua.includes('Mac OS X') || ua.includes('Macintosh')) return 'Mac';
  if (ua.includes('CrOS')) return 'Chromebook';
  if (ua.includes('Linux')) return 'Linux';

  return 'Unknown OS';
};
