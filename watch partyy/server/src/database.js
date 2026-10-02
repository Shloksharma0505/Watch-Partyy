import { MongoClient } from 'mongodb';

/**
 * Small persistence layer. MongoDB is optional: when MONGODB_URI is missing,
 * the app keeps using its in-memory state so local development still works.
 */
export class Database {
  constructor() {
    this.uri = process.env.MONGODB_URI?.trim();
    this.dbName = process.env.MONGODB_DB || 'youtube_watch_party';
    this.client = null;
    this.db = null;
    this.rooms = null;
    this.enabled = Boolean(this.uri);
  }

  async connect() {
    if (!this.enabled) return false;
    this.client = new MongoClient(this.uri, { serverSelectionTimeoutMS: 8000 });
    await this.client.connect();
    this.db = this.client.db(this.dbName);
    this.rooms = this.db.collection('rooms');
    await this.rooms.createIndex({ roomId: 1 }, { unique: true });
    return true;
  }

  async loadRooms() {
    if (!this.enabled || !this.rooms) return [];
    return this.rooms.find({}).toArray();
  }

  async saveRoom(room) {
    if (!this.enabled || !this.rooms) return;
    await this.rooms.updateOne(
      { roomId: room.id },
      {
        $set: {
          roomId: room.id,
          state: room.state,
          participants: [...room.participants.values()].map((p) => ({
            userId: p.userId,
            username: p.username,
            role: p.role,
            token: p.token,
            joinedAt: p.joinedAt,
            connected: p.connected,
          })),
          chat: room.chat.slice(-100),
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
  }

  async deleteRoom(roomId) {
    if (!this.enabled || !this.rooms) return;
    await this.rooms.deleteOne({ roomId });
  }

  async close() {
    await this.client?.close();
  }

  status() {
    return { enabled: this.enabled, connected: Boolean(this.db) };
  }
}
