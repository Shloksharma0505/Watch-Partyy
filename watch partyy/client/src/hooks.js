import { useCallback, useEffect, useRef, useState } from 'react';
import { socket, getToken } from './socket.js';
import { ACTION_TEXT } from './lib/youtube.js';

let toastSeq = 0;

/**
 * All real-time state for one room lives here. Components only read state and call `act(...)`.
 * The server is the single source of truth: we never update local state optimistically.
 */
export function useWatchParty({ mode, roomId: initialRoomId, username }, onExit) {
  const [status, setStatus] = useState('connecting'); // connecting | ready | reconnecting | error
  const [error, setError] = useState('');
  const [roomId, setRoomId] = useState(initialRoomId || '');
  const [meId, setMeId] = useState(null);
  const [participants, setParticipants] = useState([]);
  const [requests, setRequests] = useState([]);
  const [chat, setChat] = useState([]);
  const [sync, setSync] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [reactions, setReactions] = useState([]);

  const roomRef = useRef(initialRoomId || '');
  const meRef = useRef(null);
  const joinedRef = useRef(false);
  const exitRef = useRef(onExit);
  exitRef.current = onExit;

  const toast = useCallback((text, kind = 'info') => {
    const id = ++toastSeq;
    setToasts((t) => [...t.slice(-3), { id, text, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  useEffect(() => {
    const join = () => {
      const creating = mode === 'create' && !roomRef.current;
      socket.emit(
        creating ? 'create_room' : 'join_room',
        { roomId: roomRef.current, username, token: getToken() },
        (res) => {
          if (!res?.ok) {
            if (joinedRef.current) exitRef.current(res?.error || 'You were disconnected from the room.');
            else {
              setStatus('error');
              setError(res?.error || 'Could not join the room.');
            }
            return;
          }
          joinedRef.current = true;
          roomRef.current = res.roomId;
          meRef.current = res.userId;
          setRoomId(res.roomId);
          setMeId(res.userId);
          setParticipants(res.participants);
          setRequests(res.requests);
          setChat(res.chat);
          setSync(res.state);
          setStatus('ready');
        },
      );
    };

    const names = (ps, id) => ps.find((p) => p.userId === id)?.username;
    const handlers = {
      connect: join,
      disconnect: () => setStatus((s) => (s === 'ready' ? 'reconnecting' : s)),
      sync_state: (s) => {
        setSync(s);
        if (s.by && ['play', 'pause', 'seek', 'change_video'].includes(s.reason)) {
          const what = { play: 'pressed play', pause: 'paused', seek: 'jumped to a new spot', change_video: 'changed the video' }[s.reason];
          toast(s.approvedBy ? `${s.by} ${what} (approved by ${s.approvedBy})` : `${s.by} ${what}`);
        }
      },
      user_joined: (d) => {
        setParticipants(d.participants);
        toast(`${d.username} joined`);
      },
      user_left: (d) => {
        setParticipants(d.participants);
        toast(`${d.username} left`);
      },
      participants_updated: (d) => setParticipants(d.participants),
      role_assigned: (d) => {
        setParticipants(d.participants);
        toast(d.userId === meRef.current ? `You are now a ${d.role}` : `${d.username} is now a ${d.role}`);
      },
      participant_removed: (d) => {
        setParticipants(d.participants);
        toast(`${d.username} was removed by the host`);
      },
      host_transferred: (d) => {
        setParticipants(d.participants);
        toast(d.userId === meRef.current ? 'You are now the host' : `${d.username} is now the host`);
      },
      requests_updated: (d) => setRequests(d.requests),
      request_created: (d) => toast(`${d.request.username} wants to ${ACTION_TEXT[d.request.type](d.request.payload)}`),
      request_resolved: (d) =>
        toast(
          d.approved ? `${d.by} approved your request` : `${d.by} declined your request`,
          d.approved ? 'ok' : 'error',
        ),
      chat_message: (m) => setChat((c) => [...c.slice(-99), m]),
      reaction: (r) => {
        setReactions((rs) => [...rs.slice(-20), { ...r, left: 8 + Math.random() * 84 }]);
        setTimeout(() => setReactions((rs) => rs.filter((x) => x.id !== r.id)), 2600);
      },
      error_message: (e) => toast(e.message, 'error'),
      removed: () => exitRef.current('The host removed you from the room.'),
      replaced: () => exitRef.current('This session was opened in another tab.'),
    };

    for (const [ev, fn] of Object.entries(handlers)) socket.on(ev, fn);
    socket.connect();
    return () => {
      for (const [ev, fn] of Object.entries(handlers)) socket.off(ev, fn);
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const act = useCallback((event, payload = {}) => socket.emit(event, payload, () => {}), []);

  const leave = useCallback(() => {
    socket.emit('leave_room', {}, () => {});
    exitRef.current('');
  }, []);

  const me = participants.find((p) => p.userId === meId) || null;
  const canControl = me?.role === 'host' || me?.role === 'moderator';
  return { status, error, roomId, meId, me, canControl, participants, requests, chat, sync, toasts, reactions, act, leave, toast };
}
