import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { Server } from 'socket.io';
import { RoomManager } from './models/RoomManager.js';
import { SocketHandler } from './SocketHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  const server = http.createServer(app);

  // In production the React build is served by this same server => same origin => no CORS needed.
  // For split deployments set CLIENT_ORIGIN="https://my-frontend.example.com".
  const origins = process.env.CLIENT_ORIGIN?.split(',').map((s) => s.trim());
  const io = new Server(server, {
    cors: origins ? { origin: origins } : undefined,
    pingInterval: 20_000,
    pingTimeout: 25_000,
  });

  const manager = new RoomManager(io);
  new SocketHandler(io, manager).attach();
  manager.startHeartbeat();

  app.get('/health', (_req, res) => res.json({ status: 'ok', ...manager.stats() }));

  const dist = path.resolve(__dirname, '../../client/dist');
  if (fs.existsSync(dist)) {
    app.use(express.static(dist));
    // SPA fallback so /room/ABC123 deep links load the React app.
    app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
  }

  return { app, server, io, manager };
}
