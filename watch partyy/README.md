# YouTube Watch Party

Watch YouTube together in real time. One person hosts a room, everyone else joins with a code or link, and
play / pause / seek / video changes stay in sync for the whole room. Roles decide who can control playback.

**Live demo:** `https://YOUR-APP.onrender.com`  ← replace after deploying (steps below)

## Features

- Create a room (creator is **Host**) or join via 6-character code or `/room/CODE` link
- Real-time sync of play, pause, seek and current video over WebSockets (Socket.IO)
- Roles: **Host**, **Moderator**, **Participant**, **Viewer** - enforced on the server
- Host can assign roles, remove participants and transfer host
- **Approval flow:** participants/viewers can *request* play, pause, seek or a video change; host/moderators approve or decline
- Participant list with roles and online status, role changes broadcast live
- Chat and emoji reactions (bonus)
- Reconnect-safe: refreshing the page keeps your identity and role (private session token)
- Late joiners receive the current video, position and play state immediately

## Roles

| Role | Play / pause / seek / change video | Approve requests | Assign roles, remove, transfer host |
|---|---|---|---|
| Host (room creator) | Yes | Yes | Yes |
| Moderator | Yes | Yes | No |
| Participant | Request only | No | No |
| Viewer (alias of participant) | Request only | No | No |

## Tech stack

| Layer | Choice |
|---|---|
| Frontend | React 18 + Vite |
| Backend | Node.js + Express |
| Realtime | Socket.IO (WebSocket transport with polling fallback) |
| Video | YouTube IFrame Player API |
| State | MongoDB persistence when `MONGODB_URI` is configured; in-memory fallback otherwise |

## Run locally

Requires Node 18+. MongoDB Atlas is recommended for persistent rooms; the app still runs without MongoDB for local development.

```bash
npm run install:all      # installs server + client dependencies

# optional: copy .env.example to server/.env and set MONGODB_URI + MONGODB_DB

# terminal 1 - backend on :3001
npm run dev:server

# terminal 2 - frontend on :5173 (proxies /socket.io to :3001)
npm run dev:client
```

Open http://localhost:5173. To test multiple users, open extra **tabs** (each tab is its own user).

Production-style (single process, what Render runs):

```bash
npm run build && npm start     # http://localhost:3001
```

Tests (real WebSocket clients against a real server, 21 checks covering roles, approvals, sync, reconnect):

```bash
npm test
```

## Deploy on Render (free)

1. Push this folder to a GitHub repo.
2. Render dashboard → **New → Blueprint** → pick the repo. `render.yaml` configures everything.
   (Or **New → Web Service** with Build Command `npm run build`, Start Command `npm start`.)
3. When it's live, copy the URL into the "Live demo" line above.

MongoDB is optional locally. For persistence, set `MONGODB_URI` and optionally `MONGODB_DB` in the Render environment. Optional: `CLIENT_ORIGIN` (comma-separated) only if the frontend is hosted on a different domain, and `VITE_SERVER_URL` at build time in that case.

Note: Render's free tier sleeps after ~15 min idle, so the first request after a pause takes ~30-50 s. Open the URL once before a demo.

## Architecture

```
 Browser (React)                         Node server (Express + Socket.IO)
 ┌────────────────┐   WebSocket events   ┌──────────────────────────────────────┐
 │ YouTube player │ ───────────────────► │ SocketHandler  (validate + authorise) │
 │ controls / UI  │                      │        │                              │
 │                │ ◄─────────────────── │        ▼                              │
 └────────────────┘   sync_state, roles… │ Room (state, roles, requests, chat)   │
                                         │        ▲                              │
                                         │ RoomManager (codes, heartbeat)        │
                                         └──────────────────────────────────────┘
```

**Flow of one action (host presses pause):**
1. Client emits `pause`. The UI never changes the player directly.
2. `SocketHandler` looks up who the socket is (from `socket.data`, not the payload), checks `can(role, 'control')`.
3. `Room.applyAction` updates the single authoritative state `{videoId, playState, currentTime, updatedAt}`.
4. Server broadcasts `sync_state` to the Socket.IO room. **Every** client (including the sender) applies it to its YouTube player.

**Participant flow:** `request_action` → stored in `Room.requests` → `request_created` to host/mods → `resolve_request {approve}` → if approved the same `applyAction` + `sync_state` path runs → `request_resolved` tells the requester.

**Keeping clients in sync:** while a video plays, the server stores `currentTime` + `updatedAt`, so it can always compute the true position. It re-broadcasts that every 8 s (`heartbeat`); clients only seek if they drifted more than 2 s. Late joiners get the computed position in the join response.

### Classes (OOP)

- `Participant` - identity, role, socket id, private token, connection state
- `Room` - all room state and rules: participants, roles, playback state, approval requests, chat, broadcast helpers
- `RoomManager` - creates rooms, unique codes, heartbeat timer, cleanup
- `SocketHandler` - maps events to room operations; the only place that checks permissions
- `permissions.js` - one role → permission matrix used everywhere

### WebSocket events

| Event | Direction | Who | Notes |
|---|---|---|---|
| `create_room`, `join_room` `{roomId, username, token}` | C→S | anyone | ack returns role, participants, state, chat |
| `leave_room` | C→S | member | |
| `play {time?}`, `pause {time?}`, `seek {time}`, `change_video {videoId or URL}` | C→S | Host, Moderator | others get `FORBIDDEN` |
| `request_action {action, payload}` | C→S | Participant, Viewer | |
| `resolve_request {requestId, approve}` | C→S | Host, Moderator | |
| `assign_role {userId, role}` | C→S | Host | role ∈ moderator / participant / viewer |
| `remove_participant {userId}` | C→S | Host | |
| `transfer_host {userId}` | C→S | Host | old host becomes moderator |
| `chat_message {text}`, `reaction {emoji}` | C→S | everyone | rate limited |
| `sync_state` | S→C | | `{videoId, playState, currentTime, reason, by, approvedBy}` |
| `user_joined`, `user_left`, `role_assigned`, `participant_removed`, `host_transferred`, `participants_updated` | S→C | | all include the full `participants` list with roles |
| `request_created`, `requests_updated`, `request_resolved` | S→C | | controllers see all requests, others only their own |
| `error_message` | S→C | | permission / validation errors |
| `removed`, `replaced` | S→C | | you were kicked / opened elsewhere |

## Security notes

- Identity comes from the socket, never from payloads. A client cannot claim to be someone else.
- Each user has a private session `token` (never broadcast) used only to resume after a refresh; the public `userId` is separate, so knowing someone's `userId` cannot hijack their role.
- All inputs validated (names, times, YouTube URLs/IDs); chat is rendered as text by React (no HTML injection); chat and reactions are rate limited.

## Trade-offs and limitations

- **MongoDB persistence:** when configured, room playback state, participants/roles and recent chat are persisted. Without `MONGODB_URI`, the app intentionally falls back to in-memory mode for easy local development.
- **No account authentication:** names are display names only; the private room session token is used to resume a participant session. Full login/auth is a bonus extension.
- For larger scale, use the Socket.IO Redis adapter plus a shared room-state store and sticky sessions behind a load balancer.
- Browsers may block autoplay with sound; users then see a one-click "join playback" prompt.
- Some videos disable embedding; the player shows a message and the host can pick another video.
- A removed user can rejoin with the code (no ban list).
