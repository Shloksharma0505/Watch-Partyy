import crypto from 'node:crypto';

export class Participant {
  constructor({ username, role, socketId, token }) {
    this.userId = crypto.randomBytes(4).toString('hex'); // public id, safe to broadcast
    this.token = token; // private session secret - NEVER broadcast. Used to resume after refresh.
    this.username = username;
    this.role = role;
    this.socketId = socketId;
    this.connected = true;
    this.joinedAt = Date.now();
    this.removalTimer = null;
    this.chatTimes = [];
    this.lastReactionAt = 0;
  }

  rebind(socketId) {
    this.clearTimer();
    this.socketId = socketId;
    this.connected = true;
  }

  scheduleRemoval(fn, ms) {
    this.clearTimer();
    this.removalTimer = setTimeout(fn, ms);
  }

  clearTimer() {
    if (this.removalTimer) clearTimeout(this.removalTimer);
    this.removalTimer = null;
  }

  toJSON() {
    return {
      userId: this.userId,
      username: this.username,
      role: this.role,
      connected: this.connected,
    };
  }
}
