# Viva cheat sheet (read this before the walkthrough)

## 30-second pitch
"It's a React app + Node/Express server. Clients talk to the server over Socket.IO (WebSockets). The server owns
the state of each room - video, play/pause, time, roles - and broadcasts every change, so everybody's YouTube
player is driven by the same state. Permissions are checked on the server, not in the UI."

## Why WebSockets / Socket.IO?
- HTTP is request/response; the server can't push. WebSockets keep one open two-way connection, so a pause by the
  host reaches everyone in milliseconds.
- Socket.IO adds rooms (`socket.join(roomId)` / `io.to(roomId).emit`), acks, auto-reconnect, and a polling fallback.

## How does sync actually work?
1. Only the server changes state (`Room.applyAction`). Clients never update the player on their own.
2. Server stores `currentTime` + `updatedAt`; while playing, real position = `currentTime + (now - updatedAt)`.
3. Broadcast `sync_state`; every client calls `seekTo / playVideo / pauseVideo` on the YouTube IFrame player.
4. Every 8 s a heartbeat re-sends the state; clients correct only if drift > 2 s (avoids jitter).
5. Late joiners get the same computed state in the join ack.
6. The iframe has `controls:0` and a transparent overlay, so users can't desync by clicking the video.

## Role-based access (backend)
- `permissions.js`: matrix role → permissions (`control`, `assign_role`, `remove`, `transfer`).
- `SocketHandler`: every privileged handler starts with `session()` (who am I, from `socket.data`) and `need(me, perm)`.
  Failure throws `AppError('FORBIDDEN')` → ack + `error_message` event. State is never touched before the check.
- Roles are broadcast (`role_assigned`) with the full participant list; the UI derives `canControl` from it and
  swaps buttons ("Change video" → "Request change").
- Host-only: assign_role, remove_participant, transfer_host. Moderator: control + approve requests.
- "host" can't be assigned directly, only via transfer (keeps exactly one host).

## Approval flow (the extra requirement)
Participant → `request_action` → `Room.requests` (one pending per user per action; stored without stale time) →
`request_created` to controllers → controller `resolve_request` → if approved, same code path as a direct action.

## Tricky bits I handled (good "issues I ran into" answers)
- Refresh/disconnect: a private per-tab `token` re-attaches you to your participant; 20 s grace before removal.
- Host leaves: oldest connected moderator, else oldest connected user becomes host.
- Security: public `userId` vs private `token` so IDs in broadcasts can't be used to steal a role.
- Feedback loops: clients never emit events from player callbacks; they only emit from user clicks.
- Autoplay policy: fallback "click to join playback" overlay.
- Express serves the built React app, so one service, one origin, no CORS.

## Deployment (Render)
- `render.yaml`: build `npm run build` (installs client incl. devDeps, builds Vite, installs server), start `npm start`.
- Render injects `PORT`; server reads `process.env.PORT`. Health check: `/health`.
- Free tier sleeps when idle; WebSockets work on Render web services.

## If asked "how would you scale it?"
Multiple Node instances behind a load balancer with sticky sessions, `@socket.io/redis-adapter` so `io.to(room).emit`
reaches sockets on other instances, and room state in Redis (or Postgres) instead of process memory. Not built here.
