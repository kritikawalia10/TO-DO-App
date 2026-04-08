import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000';

let socket;
export const initSocket = (token) => {
  if (socket) return socket;
  try {
    socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socket.on('connect_error', (err) => { console.warn('Socket connect error', err && err.message); });
    socket.on('error', (err) => { console.warn('Socket error', err); });
    return socket;
  } catch (e) {
    console.warn('Socket init failed', e && e.message);
    return null;
  }
};

export const getSocket = () => socket;
