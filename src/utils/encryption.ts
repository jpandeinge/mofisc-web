// src/utils/encryption.ts
// AES-256-GCM encryption for localStorage data using the Web Crypto API.
// Key is generated once per session and persisted in sessionStorage
// so it survives page reloads but is cleared when the tab closes.

const SESSION_KEY_NAME = 'galahad_enc_key';
const ALGORITHM = 'AES-GCM';
const KEY_BITS = 256;
const IV_BYTES = 12; // 96-bit IV — recommended for GCM

let cachedKey: CryptoKey | null = null;

const uint8ToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToUint8 = (base64: string): Uint8Array<ArrayBuffer> => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
};

// Retrieve or generate the AES key for this session.
const getKey = async (): Promise<CryptoKey> => {
  if (cachedKey) return cachedKey;

  const stored = sessionStorage.getItem(SESSION_KEY_NAME);
  if (stored) {
    try {
      cachedKey = await crypto.subtle.importKey(
        'raw',
        base64ToUint8(stored),
        { name: ALGORITHM },
        false,
        ['encrypt', 'decrypt']
      );
      return cachedKey;
    } catch {
      // Stored key is corrupted — fall through to generate a new one
    }
  }

  cachedKey = await crypto.subtle.generateKey(
    { name: ALGORITHM, length: KEY_BITS },
    true, // extractable — needed to persist in sessionStorage
    ['encrypt', 'decrypt']
  );

  const raw = await crypto.subtle.exportKey('raw', cachedKey);
  sessionStorage.setItem(SESSION_KEY_NAME, uint8ToBase64(new Uint8Array(raw)));

  return cachedKey;
};

// Encrypt a plaintext string → base64-encoded ciphertext (IV prepended).
export const encrypt = async (plaintext: string): Promise<string> => {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    new TextEncoder().encode(plaintext)
  );

  // Layout: [IV (12 bytes)] [ciphertext (variable)]
  const combined = new Uint8Array(IV_BYTES + cipherBuffer.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(cipherBuffer), IV_BYTES);

  return uint8ToBase64(combined);
};

// Decrypt a base64-encoded ciphertext → original plaintext.
// Returns null on any failure (wrong key, corrupted data, missing IV, etc.)
// so that callers can gracefully fall back to a fresh fetch.
export const decrypt = async (ciphertext: string): Promise<string | null> => {
  try {
    const key = await getKey();
    const combined = base64ToUint8(ciphertext);

    if (combined.length <= IV_BYTES) return null;

    const iv = combined.slice(0, IV_BYTES);
    const encrypted = combined.slice(IV_BYTES);

    const plainBuffer = await crypto.subtle.decrypt(
      { name: ALGORITHM, iv },
      key,
      encrypted
    );

    return new TextDecoder().decode(plainBuffer);
  } catch {
    return null;
  }
};
