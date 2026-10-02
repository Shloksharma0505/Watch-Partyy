// End-to-end test of rooms, roles, approvals and sync over real WebSockets.
import { io as connect } from 'socket.io-client';
import assert from 'node:assert/strict';
process.env.GRACE_MS = '400';
const { createApp } = await import('../src/app.js');

const { server, manager } = createApp();
await new Promise((r) => server.listen(0, r));
const url = `http://localhost:${server.address().port}`;

const tok = () => 'tok_' + Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const emit = (s, ev, p) => new Promise((res) => s.emit(ev, p, res));
const once = (s, ev, ms = 1500) =>
  new Promise((res, rej) => {
    const t = setTimeout(() => rej(new Error(`timeout waiting for ${ev}`)), ms);
    s.once(ev, (d) => (clearTimeout(t), res(d)));
  });
const client = () => connect(url, { transports: ['websocket'], forceNew: true });

let passed = 0;
const ok = (name) => console.log(`  ✓ ${name}`) || passed++;

const A = client(), B = client(), C = client();
await Promise.all([A, B, C].map((s) => once(s, 'connect')));
const tA = tok(), tB = tok(), tC = tok();

// --- create / join
const created = await emit(A, 'create_room', { username: 'Asha', token: tA });
assert.equal(created.ok, true);
assert.equal(created.role, 'host');
assert.match(created.roomId, /^[A-Z2-9]{6}$/);
ok('creator becomes Host and gets a 6-char code');

const bad = await emit(B, 'join_room', { roomId: 'ZZZZZZ', username: 'Bo', token: tB });
assert.equal(bad.ok, false);
ok('joining an unknown room is rejected');

const joinedEvt = once(A, 'user_joined');
const joinedB = await emit(B, 'join_room', { roomId: created.roomId.toLowerCase(), username: 'Bo', token: tB });
assert.equal(joinedB.role, 'participant');
const ev = await joinedEvt;
assert.equal(ev.username, 'Bo');
assert.equal(ev.participants.length, 2);
assert.ok(!JSON.stringify(ev).includes(tB), 'token must never leak');
ok('joiner is Participant; room is told via user_joined (case-insensitive code, no token leak)');

await emit(C, 'join_room', { roomId: created.roomId, username: 'Cy', token: tC });
const idB = joinedB.userId, idC = (await emit(C, 'join_room', { roomId: created.roomId, username: 'Cy', token: tC })).userId;

// --- enforcement
let errP = once(B, 'error_message');
let r = await emit(B, 'change_video', { videoId: 'dQw4w9WgXcQ' });
assert.equal(r.ok, false); assert.equal(r.code, 'FORBIDDEN');
assert.equal((await errP).event, 'change_video');
for (const ev of ['play', 'pause']) assert.equal((await emit(B, ev, {})).code, 'FORBIDDEN');
assert.equal((await emit(B, 'seek', { time: 30 })).code, 'FORBIDDEN');
ok('participant cannot play/pause/seek/change_video (server rejects + error_message)');
assert.equal((await emit(B, 'assign_role', { userId: idC, role: 'moderator' })).code, 'FORBIDDEN');
assert.equal((await emit(B, 'remove_participant', { userId: idC })).code, 'FORBIDDEN');
assert.equal((await emit(B, 'transfer_host', { userId: idC })).code, 'FORBIDDEN');
ok('participant cannot assign roles / remove / transfer host');

// --- host controls are broadcast
let syncB = once(B, 'sync_state');
await emit(A, 'seek', { time: 42 });
let s = await syncB;
assert.equal(s.reason, 'seek'); assert.equal(Math.round(s.currentTime), 42);
syncB = once(B, 'sync_state');
await emit(A, 'play', { time: 42 });
s = await syncB; assert.equal(s.playState, 'playing');
await wait(300);
syncB = once(B, 'sync_state');
await emit(A, 'pause', {});
s = await syncB; assert.equal(s.playState, 'paused'); assert.ok(s.currentTime >= 42.2, 'server extrapolated the playing time');
syncB = once(B, 'sync_state');
await emit(A, 'change_video', { videoId: 'https://youtu.be/dQw4w9WgXcQ?t=5' });
s = await syncB; assert.equal(s.videoId, 'dQw4w9WgXcQ'); assert.equal(s.currentTime, 0);
ok('host play/pause/seek/change_video (URL parsed) broadcast to the room');
assert.equal((await emit(A, 'change_video', { videoId: 'not a url' })).ok, false);
ok('invalid YouTube links are rejected');

// --- late joiner gets current state
const late = client(); await once(late, 'connect');
const lj = await emit(late, 'join_room', { roomId: created.roomId, username: 'Late', token: tok() });
assert.equal(lj.state.videoId, 'dQw4w9WgXcQ');
late.close(); await wait(700); // let the grace period expire
ok('late joiner receives the current state in the join ack');

// --- approval flow
const created1 = once(A, 'request_created');
const reqUpd = once(B, 'requests_updated');
r = await emit(B, 'request_action', { action: 'change_video', payload: { videoId: 'M7lc1UVf-VE' } });
assert.ok(r.ok && r.requestId);
const rc = await created1;
assert.equal(rc.request.username, 'Bo');
assert.equal((await reqUpd).requests.length, 1);
ok('participant request reaches the host; requester sees it pending');

assert.equal((await emit(B, 'resolve_request', { requestId: r.requestId, approve: true })).code, 'FORBIDDEN');
ok('participant cannot approve their own request');

const resolvedB = once(B, 'request_resolved');
syncB = once(B, 'sync_state');
await emit(A, 'resolve_request', { requestId: r.requestId, approve: true });
s = await syncB;
assert.equal(s.videoId, 'M7lc1UVf-VE'); assert.equal(s.by, 'Bo'); assert.equal(s.approvedBy, 'Asha');
assert.equal((await resolvedB).approved, true);
ok('approved request is applied for everyone and the requester is notified');

r = await emit(B, 'request_action', { action: 'pause', payload: {} });
const dec = once(B, 'request_resolved');
await emit(A, 'resolve_request', { requestId: r.requestId, approve: false });
assert.equal((await dec).approved, false);
assert.equal(manager.get(created.roomId).state.playState, 'playing');
ok('declined request changes nothing');

// --- roles
let roleEvt = once(C, 'role_assigned');
await emit(A, 'assign_role', { userId: idB, role: 'moderator' });
const ra = await roleEvt;
assert.equal(ra.role, 'moderator');
assert.equal(ra.participants.find((p) => p.userId === idB).role, 'moderator');
ok('host promotes Participant → Moderator; broadcast carries updated participant list');

syncB = once(C, 'sync_state');
assert.equal((await emit(B, 'pause', {})).ok, true);
assert.equal((await syncB).playState, 'paused');
ok('moderator can now control playback');
assert.equal((await emit(B, 'assign_role', { userId: idC, role: 'moderator' })).code, 'FORBIDDEN');
assert.equal((await emit(A, 'assign_role', { userId: idB, role: 'host' })).ok, false);
ok('moderator cannot assign roles; "host" cannot be assigned directly');

// --- reconnect keeps identity
const A2 = client(); await once(A2, 'connect');
A.close(); await wait(100);
const re = await emit(A2, 'join_room', { roomId: created.roomId, username: 'Asha', token: tA });
assert.equal(re.role, 'host'); assert.equal(re.userId, created.userId);
ok('host refreshing the page (same token) keeps the Host role');

// --- transfer host
const ht = once(C, 'host_transferred');
await emit(A2, 'transfer_host', { userId: idB });
const h = await ht;
assert.equal(h.userId, idB);
assert.equal(h.participants.find((p) => p.userId === created.userId).role, 'moderator');
assert.equal(h.participants.find((p) => p.userId === idB).role, 'host');
ok('transfer host: new host promoted, old host becomes moderator');

// --- remove
const removed = once(C, 'removed');
const prm = once(B, 'participant_removed');
assert.equal((await emit(A2, 'remove_participant', { userId: idC })).code, 'FORBIDDEN'); // A2 no longer host
await emit(B, 'remove_participant', { userId: idC });
assert.equal((await removed).by, 'Bo');
assert.equal((await prm).participants.length, 2);
assert.equal((await emit(C, 'play', {})).code, 'NOT_IN_ROOM');
ok('host removes a participant; they are told, list updates, they lose access');

// --- chat
const chatP = once(A2, 'chat_message');
await emit(B, 'chat_message', { text: '  hello <b>world</b>  ' });
assert.equal((await chatP).text, 'hello <b>world</b>');
ok('chat is broadcast (trimmed)');

// --- auto host succession when host leaves
const hp = once(A2, 'host_transferred');
await emit(B, 'leave_room', {});
const auto = await hp;
assert.equal(auto.auto, true); assert.equal(auto.userId, created.userId);
ok('host leaves → host role passes automatically');

// --- room cleanup
A2.close(); await wait(900);
assert.equal(manager.rooms.size, 0);
ok('empty rooms are garbage-collected');

[A, B, C, A2].forEach((s) => s.close());
server.close();
manager.stop();
console.log(`\n${passed} checks passed`);
process.exit(0);
