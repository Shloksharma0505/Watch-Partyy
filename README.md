# 🎬 YouTube Watch Party

A real-time YouTube Watch Party application that allows multiple users to watch YouTube videos together in synchronized rooms.

Users can create or join a room, watch YouTube videos together, chat with other participants, send reactions, and stay synchronized when the Host or Moderator plays, pauses, seeks, or changes the video.

The application also provides role-based access control, participant action requests, backend permission validation, and MongoDB-based room persistence.

---

## 🚀 Live Demo

### Frontend

https://watch-partyy-client-1226.vercel.app

### GitHub Repository

https://github.com/Shloksharma0505/Watch-Partyy

---

# ✨ Features

## 🎥 Real-Time YouTube Synchronization

- Play synchronization
- Pause synchronization
- Seek synchronization
- YouTube video change synchronization
- Current playback position synchronization
- Late-join synchronization
- Periodic playback synchronization
- YouTube IFrame Player API integration

When the Host or Moderator performs a playback action, the server validates the action and broadcasts the updated state to users in the room.

---

## 🏠 Watch Rooms

- Create a watch room
- Join using a room code
- Unique room identification
- Room-based Socket.IO communication
- Dynamic participant management
- Persistent room state using MongoDB
- Automatic room heartbeat and cleanup

---

# 👥 Role-Based Access Control

The application supports four user roles:

| Role | Permissions |
|------|-------------|
| Host | Full room and playback control |
| Moderator | Playback control |
| Participant | Watch videos and request restricted actions |
| Viewer | Watch synchronized content |

---

## 👑 Host

The Host has full control over the room.

The Host can:

- Play video
- Pause video
- Seek video
- Change YouTube video
- Assign participant roles
- Remove participants
- Transfer Host privileges
- Approve participant requests
- Decline participant requests

---

## 🛡️ Moderator

The Moderator can control playback:

- Play
- Pause
- Seek
- Change video

The Moderator cannot:

- Assign roles
- Remove participants
- Transfer Host
- Manage Host permissions

---

## 👤 Participant / Viewer

Participants can:

- Watch synchronized playback
- View other participants
- Send chat messages
- Send emoji reactions
- Request restricted playback actions

Restricted actions are processed through the Host approval system.

---

# 🔐 Backend Permission Enforcement

Permissions are validated on the backend.

Frontend restrictions alone are not considered sufficient for authorization.

For every restricted action, the server checks:

```text
User
  ↓
Room
  ↓
Role
  ↓
Permission
  ↓
Allow / Reject
