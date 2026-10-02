import crypto from 'node:crypto';
import { Participant } from './Participant.js';
import { ROLES, can } from '../permissions.js';
import { AppError } from '../errors.js';

export const DEFAULT_VIDEO = 'M7lc1UVf-VE';
export const GRACE_MS = Number(process.env.GRACE_MS) || 20_000; // how long a dropped connection may return
export const MAX_PARTICIPANTS = 100;
const MAX_REQUESTS = 30;
const MAX_CHAT = 100;
const round = (n) => Math.round(n * 1000) / 1000;

/**
 * A Room owns ALL state for one watch party: participants, roles, the shared
 * video state, pending approval requests and chat. Nothing else mutates it.
 */
export class Room {
  constructor(id, io, onEmpty = () => {}, onChange = () => {}) {
    this.id = id;
    this.io = io;
    this.onEmpty = onEmpty;
    this.onChange = onChange;
    this.participants = new Map(); // userId -> Participant
    this.requests = new Map(); // requestId -> request
    this.chat = [];
    this.state = { videoId: DEFAULT_VIDEO, playState: 'paused', currentTime: 0, updatedAt: Date.now() };
  }

  touch() {
    try { this.onChange(this); } catch (err) { console.error('[room persistence]', err); }
  }

  // ---------- messaging helpers ----------
  broadcast(event, payload) {
    this.io.to(this.id).emit(event, payload);
  }

  sendTo(userId, event, payload) {
    const p = this.participants.get(userId);
    if (p?.connected) this.io.to(p.socketId).emit(event, payload);
  }

  sendToControllers(event, payload) {
    for (const p of this.participants.values()) {
      if (can(p.role, 'control')) this.sendTo(p.userId, event, payload);
    }
  }

  // ---------- participants ----------
  participantList() {
    return [...this.participants.values()].sort((a, b) => a.joinedAt - b.joinedAt).map((p) => p.toJSON());
  }

  /** Adds a new participant, or re-attaches an existing one that presents the same session token. */
  addParticipant({ username, token, socketId }) {
    const existing = [...this.participants.values()].find((p) => p.token === token);
    if (existing) {
      const previousSocketId = existing.socketId;
      existing.rebind(socketId);
      return { participant: existing, isNew: false, previousSocketId };
    }
    if (this.participants.size >= MAX_PARTICIPANTS) {
      throw new AppError('ROOM_FULL', 'This room is full.');
    }
    // If a persisted room no longer has its original host, the first new person
    // becomes host so the room never gets stuck without a controller.
    const hasHost = [...this.participants.values()].some((p) => p.role === ROLES.HOST);
    const role = !hasHost ? ROLES.HOST : ROLES.PARTICIPANT;
    const participant = new Participant({ username, role, socketId, token });
    this.participants.set(participant.userId, participant);
    this.touch();
    return { participant, isNew: true, previousSocketId: null };
  }

  markDisconnected(userId) {
    const p = this.participants.get(userId);
    if (!p) return;
    p.connected = false;
    p.scheduleRemoval(() => this.leave(userId), GRACE_MS);
    this.broadcast('participants_updated', { participants: this.participantList() });
    this.touch();
  }

  /** Voluntary leave, or a disconnect that outlived the grace period. */
  leave(userId) {
    const p = this.participants.get(userId);
    if (!p) return;
    p.clearTimer();
    this.participants.delete(userId);
    this.dropRequestsOf(userId);

    if (this.participants.size === 0) {
      this.onEmpty();
      return;
    }
    const newHost = p.role === ROLES.HOST ? this.promoteSuccessor() : null;
    this.broadcast('user_left', { userId, username: p.username, participants: this.participantList() });
    if (newHost) {
      this.broadcast('host_transferred', {
        userId: newHost.userId,
        username: newHost.username,
        previousHostId: userId,
        auto: true,
        participants: this.participantList(),
      });
    }
    this.pushRequests();
    this.touch();
  }

  kick(userId) {
    const p = this.participants.get(userId);
    if (!p) return null;
    p.clearTimer();
    this.participants.delete(userId);
    this.dropRequestsOf(userId);
    this.broadcast('participant_removed', {
      userId,
      username: p.username,
      participants: this.participantList(),
    });
    this.pushRequests();
    this.touch();
    return p;
  }

  /** Host left without transferring: oldest connected moderator, else oldest connected user. */
  promoteSuccessor() {
    const list = [...this.participants.values()].sort((a, b) => a.joinedAt - b.joinedAt);
    const next =
      list.find((p) => p.connected && p.role === ROLES.MODERATOR) ||
      list.find((p) => p.connected) ||
      list[0];
    if (next) { next.role = ROLES.HOST; this.touch(); }
    return next;
  }

  assignRole(userId, role) {
    const p = this.participants.get(userId);
    p.role = role;
    this.touch();
    return p;
  }

  transferHost(fromId, toId) {
    const from = this.participants.get(fromId);
    const to = this.participants.get(toId);
    from.role = ROLES.MODERATOR; // previous host keeps playback control
    to.role = ROLES.HOST;
    this.touch();
    return to;
  }

  // ---------- shared playback state ----------
  currentTime() {
    const s = this.state;
    return s.playState === 'playing' ? s.currentTime + (Date.now() - s.updatedAt) / 1000 : s.currentTime;
  }

  snapshot(reason = 'sync', by = null, approvedBy = null) {
    return {
      videoId: this.state.videoId,
      playState: this.state.playState,
      currentTime: round(this.currentTime()),
      serverTime: Date.now(),
      reason,
      by,
      approvedBy,
    };
  }

  broadcastSync(reason, by, approvedBy) {
    this.broadcast('sync_state', this.snapshot(reason, by, approvedBy));
  }

  /** The ONLY place playback state changes. Payload must already be validated. */
  applyAction(type, payload = {}) {
    const now = Date.now();
    const s = this.state;
    switch (type) {
      case 'play':
        this.state = { ...s, currentTime: payload.time ?? this.currentTime(), playState: 'playing', updatedAt: now };
        break;
      case 'pause':
        this.state = { ...s, currentTime: payload.time ?? this.currentTime(), playState: 'paused', updatedAt: now };
        break;
      case 'seek':
        this.state = { ...s, currentTime: payload.time, updatedAt: now };
        break;
      case 'change_video':
        this.state = { videoId: payload.videoId, currentTime: 0, playState: 'playing', updatedAt: now };
        break;
      default:
        throw new AppError('BAD_REQUEST', 'Unknown action.');
    }
    this.touch();
  }

  // ---------- approval requests ----------
  addRequest(participant, type, payload) {
    // One pending request per user per action type: a newer one replaces the older one.
    for (const [id, r] of this.requests) {
      if (r.userId === participant.userId && r.type === type) this.requests.delete(id);
    }
    if (this.requests.size >= MAX_REQUESTS) {
      throw new AppError('TOO_MANY_REQUESTS', 'Too many pending requests. Ask the host to clear some.');
    }
    const request = {
      id: crypto.randomUUID(),
      userId: participant.userId,
      username: participant.username,
      type,
      payload,
      createdAt: Date.now(),
    };
    this.requests.set(request.id, request);
    this.touch();
    return request;
  }

  takeRequest(id) {
    const r = this.requests.get(id);
    if (r) { this.requests.delete(id); this.touch(); }
    return r;
  }

  dropRequestsOf(userId) {
    let changed = false;
    for (const [id, r] of this.requests) { if (r.userId === userId) { this.requests.delete(id); changed = true; } }
    if (changed) this.touch();
  }

  requestsFor(participant) {
    const all = [...this.requests.values()];
    return can(participant.role, 'control') ? all : all.filter((r) => r.userId === participant.userId);
  }

  /** Controllers see every pending request; everyone else only sees their own. */
  pushRequests() {
    for (const p of this.participants.values()) {
      if (p.connected) this.io.to(p.socketId).emit('requests_updated', { requests: this.requestsFor(p) });
    }
  }

  // ---------- chat ----------
  addChat(participant, text) {
    const msg = {
      id: crypto.randomUUID(),
      userId: participant.userId,
      username: participant.username,
      role: participant.role,
      text,
      ts: Date.now(),
    };
    this.chat.push(msg);
    if (this.chat.length > MAX_CHAT) this.chat.shift();
    this.touch();
    return msg;
  }
}
