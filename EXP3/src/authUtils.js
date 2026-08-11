const TOKEN_STORAGE_KEY = 'rbac-jwt-auth-token';
const SECRET_KEY = 'exp3-demo-secret-key';
const encoder = new TextEncoder();
const decoder = new TextDecoder();

const base64UrlEncode = (buffer) => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const base64UrlDecode = (value) => {
  const padded = value.padEnd(value.length + ((4 - (value.length % 4)) % 4), '=');
  const base64 = padded.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
};

const importSigningKey = async () =>
  crypto.subtle.importKey(
    'raw',
    encoder.encode(SECRET_KEY),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );

const signData = async (data) => {
  const key = await importSigningKey();
  return crypto.subtle.sign('HMAC', key, encoder.encode(data));
};

const areBuffersEqual = (a, b) => {
  const left = new Uint8Array(a);
  const right = new Uint8Array(b);
  if (left.length !== right.length) return false;
  return left.every((value, index) => value === right[index]);
};

const serializeJwt = async (header, payload) => {
  const encodedHeader = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const encodedPayload = base64UrlEncode(encoder.encode(JSON.stringify(payload)));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;
  const signature = await signData(unsignedToken);
  return `${unsignedToken}.${base64UrlEncode(signature)}`;
};

export const createToken = async (subject, role, ttlSeconds = 1800) => {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    sub: subject,
    role,
    iat: now,
    exp: now + ttlSeconds,
  };
  return serializeJwt(header, payload);
};

export const decodeToken = (token) => {
  try {
    const [_, encodedPayload] = token.split('.');
    if (!encodedPayload) return null;
    const payloadText = decoder.decode(base64UrlDecode(encodedPayload));
    return JSON.parse(payloadText);
  } catch {
    return null;
  }
};

export const verifyToken = async (token) => {
  try {
    const [encodedHeader, encodedPayload, encodedSignature] = token.split('.');
    if (!encodedHeader || !encodedPayload || !encodedSignature) return null;
    const unsignedToken = `${encodedHeader}.${encodedPayload}`;
    const signature = base64UrlDecode(encodedSignature);
    const expectedSignature = await signData(unsignedToken);
    if (!areBuffersEqual(signature, expectedSignature)) return null;
    const payload = decodeToken(token);
    if (!payload || typeof payload.exp !== 'number') return null;
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
};

export const saveToken = (token, remember = false) => {
  clearToken();
  if (remember) {
    localStorage.setItem(TOKEN_STORAGE_KEY, token);
  } else {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  }
};

export const getStoredToken = () =>
  localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);

export const clearToken = () => {
  localStorage.removeItem(TOKEN_STORAGE_KEY);
  sessionStorage.removeItem(TOKEN_STORAGE_KEY);
};

export const users = [
  { username: 'admin', password: 'Admin123!', role: 'admin' },
  { username: 'editor', password: 'Editor123!', role: 'editor' },
  { username: 'viewer', password: 'Viewer123!', role: 'viewer' },
];

export const userDisplayName = (username) => username.charAt(0).toUpperCase() + username.slice(1);
