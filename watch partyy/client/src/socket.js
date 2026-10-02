import { io } from 'socket.io-client';

// Same-origin connection: in dev Vite proxies it, in production Express serves both app and sockets.
// Set VITE_SERVER_URL only if the backend is deployed on a different domain.
export const socket = io(import.meta.env.VITE_SERVER_URL || undefined, { autoConnect: false });

/**
 * Private per-tab session secret. The server ties it to a participant so a page refresh
 * (or brief network drop) resumes the same identity and role. Per-tab on purpose, so you can
 * open several tabs on one machine to test multiple users.
 */
export function getToken() {
  let t = sessionStorage.getItem('wp_token');
  if (!t) {
    t = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`).replace(/[^\w-]/g, '');
    if (t.length < 16) t = t.padEnd(16, 'x');
    sessionStorage.setItem('wp_token', t);
  }
  return t;
}
