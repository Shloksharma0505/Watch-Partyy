import express from 'express';
import http from 'node:http';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import cors from 'cors';
import { Server } from 'socket.io';
import { RoomManager } from './models/RoomManager.js';
import { SocketHandler } from './SocketHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export function createApp() {
  const app = express();
  const server = http.createServer(app);

  const origins = (process.env.CLIENT_ORIGIN || 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: origins,
      credentials: true,
    })
  );

  app.use(express.json());

  const io = new Server(server, {
    cors: {
      origin: origins,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: 20_000,
    pingTimeout: 25_000,
  });

  const manager = new RoomManager(io);
  new SocketHandler(io, manager).attach();
  manager.startHeartbeat();

  app.get('/health', (_req, res) =>
    res.json({
      status: 'ok',
      ...manager.stats(),
    })
  );

  const dist = path.resolve(__dirname, '../../client/dist');

  if (fs.existsSync(dist)) {
    app.use(express.static(dist));

    app.get('*', (_req, res) =>
      res.sendFile(path.join(dist, 'index.html'))
    );
  }

  return { app, server, io, manager };
}