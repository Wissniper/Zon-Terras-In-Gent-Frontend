import { io } from 'socket.io-client';

// Module-level singleton — created once regardless of React render count.
// Points directly at the backend; Vite's HTTP proxy does not handle WebSocket upgrades.
const socket = io('https://api.sun-seeker.be', {
  transports: ['websocket'],
  autoConnect: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 30_000,
});

export default socket;
