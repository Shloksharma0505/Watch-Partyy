import { AppError } from './errors.js';
import { ASSIGNABLE_ROLES, can } from './permissions.js';
import { cleanName, cleanToken, normalizeAction } from './utils.js';

const REQUESTABLE = new Set(['play', 'pause', 'seek', 'change_video']);
const REACTIONS = new Set(['🎉', '😂', '😮', '❤️', '👏', '🔥']);
const CONTROL_LABEL = {
  play: 'play the video',
  pause: 'pause the video',
  seek: 'seek the video',
  change_video: 'change the video',
};

/**
 * Translates Socket.IO events into Room operations.
 * RULE: identity comes from the socket (socket.data), never from the payload,
 * and every privileged event calls `need(me, permission)` BEFORE touching state.
 */
export class SocketHandler {
  constructor(io, manager) {
    this.io = io;
    this.manager = manager;
  }

  attach() {
    this.io.on('connection', (socket) => this.onConnection(socket));
  }

  onConnection(socket) {
    // Wrap every handler: normalise the payload, send an ack, turn AppErrors into `error_message`.
    const on = (event, handler, { silentError = false } = {}) => {
      socket.on(event, (payload, ack) => {
        if (typeof payload === 'function') [payload, ack] = [{}, payload];
        const data = payload && typeof payload === 'object' ? payload : {};
        const reply = typeof ack === 'function' ? ack : () => {};
        try {
          reply({ ok: true, ...(handler(data) ?? {}) });
        } catch (err) {
          if (err instanceof AppError) {
            reply({ ok: false, error: err.message, code: err.code });
            if (!silentError) socket.emit('error_message', { event, code: err.code, message: err.message });
          } else {
            console.error(`[${event}]`, err);
            reply({ ok: false, error: 'Something went wrong on the server.' });
          }
        }
      });
    };

    // Who is this socket, and are they still the live connection of a participant?
    const session = () => {
      const room = this.manager.get(socket.data.roomId);
      const me = room?.participants.get(socket.data.userId);
      if (!room || !me || me.socketId !== socket.id) {
        throw new AppError('NOT_IN_ROOM', 'You are not in a room.');
      }
      return { room, me };
    };

    const need = (me, permission, message) => {
      if (!can(me.role, permission)) throw new AppError('FORBIDDEN', message);
    };

    const target = (room, me, userId, { allowSelf = false } = {}) => {
      const t = room.participants.get(userId);
      if (!t) throw new AppError('NOT_FOUND', 'That person is no longer in the room.');
      if (!allowSelf && t.userId === me.userId) throw new AppError('BAD_REQUEST', "You can't do that to yourself.");
      return t;
    };

    // ---------- joining / leaving ----------
    on('create_room', (p) => this.join(socket, this.manager.createRoom(), p), { silentError: true });

    on(
      'join_room',
      (p) => {
        const room = this.manager.get(p.roomId);
        if (!room) throw new AppError('ROOM_NOT_FOUND', 'No room with that code. Check it and try again.');
        return this.join(socket, room, p);
      },
      { silentError: true },
    );

    on('leave_room', () => {
      const { room, me } = session();
      socket.leave(room.id);
      socket.data = {};
      room.leave(me.userId);
    });

    socket.on('disconnect', () => {
      const room = this.manager.get(socket.data.roomId);
      const me = room?.participants.get(socket.data.userId);
      if (room && me && me.socketId === socket.id) room.markDisconnected(me.userId);
    });

    // ---------- playback (host + moderator only) ----------
    for (const type of ['play', 'pause', 'seek', 'change_video']) {
      on(type, (p) => {
        const { room, me } = session();
        need(me, 'control', `Only the host or a moderator can ${CONTROL_LABEL[type]}. Send a request instead.`);
        room.applyAction(type, normalizeAction(type, p, true));
        room.broadcastSync(type, me.username);
      });
    }

    // ---------- approval flow ----------
    on('request_action', (p) => {
      const { room, me } = session();
      if (!REQUESTABLE.has(p.action)) throw new AppError('BAD_REQUEST', 'Unknown action.');
      const payload = normalizeAction(p.action, p.payload ?? {}, false);

      if (can(me.role, 'control')) {
        // Controllers never need approval; just do it.
        room.applyAction(p.action, normalizeAction(p.action, p.payload ?? {}, true));
        room.broadcastSync(p.action, me.username);
        return {};
      }
      const request = room.addRequest(me, p.action, payload);
      room.sendToControllers('request_created', { request });
      room.pushRequests();
      return { requestId: request.id };
    });

    on('resolve_request', (p) => {
      const { room, me } = session();
      need(me, 'control', 'Only the host or a moderator can approve requests.');
      const request = room.takeRequest(String(p.requestId));
      if (!request) throw new AppError('NOT_FOUND', 'That request is no longer pending.');
      const approved = Boolean(p.approve);
      if (approved) {
        room.applyAction(request.type, request.payload);
        room.broadcastSync(request.type, request.username, me.username);
      }
      room.sendTo(request.userId, 'request_resolved', {
        requestId: request.id,
        action: request.type,
        approved,
        by: me.username,
      });
      room.pushRequests();
    });

    // ---------- host-only: roles ----------
    on('assign_role', (p) => {
      const { room, me } = session();
      need(me, 'assign_role', 'Only the host can assign roles.');
      if (!ASSIGNABLE_ROLES.includes(p.role)) {
        throw new AppError('BAD_REQUEST', 'That role cannot be assigned. Use transfer host instead.');
      }
      const t = target(room, me, p.userId);
      room.assignRole(t.userId, p.role);
      room.broadcast('role_assigned', {
        userId: t.userId,
        username: t.username,
        role: t.role,
        participants: room.participantList(),
      });
      room.pushRequests();
    });

    on('remove_participant', (p) => {
      const { room, me } = session();
      need(me, 'remove', 'Only the host can remove participants.');
      const t = target(room, me, p.userId);
      room.sendTo(t.userId, 'removed', { by: me.username });
      const sock = this.io.sockets.sockets.get(t.socketId);
      sock?.leave(room.id);
      if (sock) sock.data = {};
      room.kick(t.userId);
    });

    on('transfer_host', (p) => {
      const { room, me } = session();
      need(me, 'transfer', 'Only the host can transfer the host role.');
      const t = target(room, me, p.userId);
      room.transferHost(me.userId, t.userId);
      room.broadcast('host_transferred', {
        userId: t.userId,
        username: t.username,
        previousHostId: me.userId,
        auto: false,
        participants: room.participantList(),
      });
      room.pushRequests();
    });

    // ---------- chat + reactions (everyone) ----------
    on('chat_message', (p) => {
      const { room, me } = session();
      const text = typeof p.text === 'string' ? p.text.trim().slice(0, 500) : '';
      if (!text) return;
      const now = Date.now();
      me.chatTimes = me.chatTimes.filter((t) => now - t < 5000);
      if (me.chatTimes.length >= 8) throw new AppError('RATE_LIMITED', 'Slow down a little.');
      me.chatTimes.push(now);
      room.broadcast('chat_message', room.addChat(me, text));
    });

    on(
      'reaction',
      (p) => {
        const { room, me } = session();
        if (!REACTIONS.has(p.emoji)) return;
        const now = Date.now();
        if (now - me.lastReactionAt < 250) return;
        me.lastReactionAt = now;
        room.broadcast('reaction', { id: `${me.userId}-${now}`, userId: me.userId, username: me.username, emoji: p.emoji });
      },
      { silentError: true },
    );
  }

  /** Shared by create_room and join_room (also used when a client reconnects with the same token). */
  join(socket, room, p) {
    const username = cleanName(p.username);
    const token = cleanToken(p.token);

    // Switching rooms on one socket: leave the old one first.
    if (socket.data.roomId && socket.data.roomId !== room.id) {
      const prev = this.manager.get(socket.data.roomId);
      socket.leave(socket.data.roomId);
      prev?.leave(socket.data.userId);
    }

    const { participant, isNew, previousSocketId } = room.addParticipant({ username, token, socketId: socket.id });

    // Same person opened a second tab/connection: the newest one wins, the old one is told.
    if (previousSocketId && previousSocketId !== socket.id) {
      const old = this.io.sockets.sockets.get(previousSocketId);
      if (old) {
        old.leave(room.id);
        old.data = {};
        old.emit('replaced', {});
      }
    }

    socket.join(room.id);
    socket.data = { roomId: room.id, userId: participant.userId };

    if (isNew) {
      socket.to(room.id).emit('user_joined', {
        userId: participant.userId,
        username: participant.username,
        role: participant.role,
        participants: room.participantList(),
      });
    } else {
      socket.to(room.id).emit('participants_updated', { participants: room.participantList() });
    }

    return {
      roomId: room.id,
      userId: participant.userId,
      role: participant.role,
      participants: room.participantList(),
      state: room.snapshot('join'),
      chat: room.chat,
      requests: room.requestsFor(participant),
    };
  }
}
