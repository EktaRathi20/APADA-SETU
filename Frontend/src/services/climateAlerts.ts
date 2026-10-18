import { io } from 'socket.io-client';

export type { AlertConnectionState, ClimateAlert } from '../types/alerts';

export function createClimateAlertSocket() {
  return io(import.meta.env.VITE_SOCKET_URL || window.location.origin, {
    path: '/socket.io',
    transports: ['websocket'],
    autoConnect: false,
  });
}