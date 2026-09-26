import io from 'socket.io-client';

// ---------------------------------------------------------------------------
// API configuration — one shared instance for the whole app
// ---------------------------------------------------------------------------
const isLocalhost = typeof window !== 'undefined' &&
  /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname);

// Priority: explicit VITE_API_URL env var > local backend (when testing on
// localhost) > deployed backend (production default).
export const API_BASE = import.meta.env.VITE_API_URL
  || (isLocalhost ? "http://localhost:5001" : "https://auction-backend-newwwww.onrender.com");

export const socket = io(API_BASE, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
});