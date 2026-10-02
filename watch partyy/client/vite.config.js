import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev: the React app runs on :5173 and proxies Socket.IO to the Node server on :3001,
// so the browser always talks to ONE origin (same as production).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/socket.io': { target: 'http://localhost:3001', ws: true },
      '/health': 'http://localhost:3001',
    },
  },
});
