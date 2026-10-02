import crypto from 'node:crypto';
import { Room } from './Room.js';
import { Participant } from './Participant.js';
import { Database } from '../database.js';

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const HEARTBEAT_MS = 8000;

export class RoomManager {
  constructor(io) {
    this.io = io;
    this.rooms = new Map();
    this.db = new Database();
    this.readyPromise = this.initialize();
  }

  async initialize() {
    try {
      await this.db.connect();
      const docs = await this.db.loadRooms();
      for (const doc of docs) {
        const room = new Room(doc.roomId, this.io, () => this.deleteRoom(doc.roomId), (r) => this.persist(r));
        if (doc.state) room.state = { ...room.state, ...doc.state };
        room.chat = Array.isArray(doc.chat) ? doc.chat.slice(-100) : [];
        for (const saved of doc.participants || []) {
          const p = new Participant({
            username: saved.username,
            role: saved.role,
            socketId: null,
            token: saved.token,
          });
          p.userId = saved.userId;
          p.joinedAt = saved.joinedAt || Date.now();
          p.connected = false;
          room.participants.set(p.userId, p);
        }
        this.rooms.set(room.id, room);
      }
      if (this.db.enabled) console.log(`[db] MongoDB connected; restored ${this.rooms.size} room(s).`);
    } catch (err) {
      console.error('[db] MongoDB unavailable; continuing with in-memory rooms.', err.message);
    }
  }

  ready() { return this.readyPromise; }

  generateCode() {
    for (;;) {
      let code = '';
      for (let i = 0; i < 6; i++) code += ALPHABET[crypto.randomInt(ALPHABET.length)];
      if (!this.rooms.has(code)) return code;
    }
  }

  createRoom() {
    const id = this.generateCode();
    const room = new Room(id, this.io, () => this.deleteRoom(id), (r) => this.persist(r));
    this.rooms.set(id, room);
    this.persist(room);
    return room;
  }

  get(id) { return this.rooms.get(String(id ?? '').trim().toUpperCase()); }

  async persist(room) {
    try { await this.db.saveRoom(room); } catch (err) { console.error('[db] save failed:', err.message); }
  }

  async deleteRoom(id) {
    this.rooms.delete(id);
    try { await this.db.deleteRoom(id); } catch (err) { console.error('[db] delete failed:', err.message); }
  }

  startHeartbeat() {
    this.timer = setInterval(() => {
      for (const room of this.rooms.values()) {
        if (room.state.playState === 'playing') room.broadcastSync('heartbeat');
      }
    }, HEARTBEAT_MS);
    this.timer.unref?.();
  }

  stop() { clearInterval(this.timer); }

  stats() {
    let users = 0;
    for (const r of this.rooms.values()) users += r.participants.size;
    return { rooms: this.rooms.size, users, database: this.db.status() };
  }
}
