# 🎬 Watch Party

> A real-time YouTube Watch Party application that allows multiple users to watch YouTube videos together in synchronized rooms.

**Watch Party** is a full-stack real-time web application designed to provide a synchronized group video-watching experience. Users can create or join rooms, watch YouTube videos together, communicate through real-time chat, and interact with other participants while the application keeps the shared playback state synchronized.

The application uses **React, Node.js, Express.js, Socket.IO, and MongoDB** to provide real-time communication, room management, playback synchronization, and persistent room data.

---

## 🚀 Live Demo

### 🌐 Frontend

[**Watch Party – Live Application**](https://watch-partyy-client-1226.vercel.app/)

### 💻 GitHub Repository

[**Watch-Partyy**](https://github.com/Shloksharma0505/Watch-Partyy)

---

## ✨ Features

### 🎬 Watch Rooms

* Create a watch party room
* Join existing rooms using a shareable room link
* Unique room identification
* Real-time room state management

### ▶️ Synchronized Playback

* Play and pause synchronization
* Seek synchronization
* Change YouTube videos in real time
* Shared playback position
* Host-controlled playback

### 👥 Participant Management

* Real-time participant list
* Join request handling
* Role-based permissions
* Host and moderator management
* Participant status updates

### 💬 Real-Time Chat

* Room-based chat
* Instant message delivery
* No page refresh required
* Messages synchronized between connected participants

### 🛡️ Access Control

* Host permissions
* Moderator permissions
* Participant restrictions
* Backend validation for restricted actions

### ⚡ Real-Time Infrastructure

* Socket.IO-based communication
* Real-time room events
* Playback state broadcasting
* Participant updates
* Role and permission updates

### 🗄️ Persistence

* MongoDB-based room storage
* Participant information
* Playback state
* Room metadata
* Chat and activity information

### ☁️ Deployment

* Frontend deployed using Vercel
* Backend deployed using Render
* Database hosted using MongoDB Atlas

---

# 🧠 How the Application Works

The application follows a **room-based real-time architecture**.

```text
                         User
                           │
                           ▼
                  Create / Join Room
                           │
                           ▼
                   React Frontend
                           │
                     Socket.IO
                           │
                           ▼
              Node.js + Express Server
                           │
                           ▼
                     Room Manager
                           │
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
    Participants     Playback State       Chat
          │                │                │
          └────────────────┼────────────────┘
                           ▼
                       MongoDB
```

When a user creates a room, the server generates a room and assigns the creator as the **host**.

Other users can join the room through a shared room link. Once connected, the server maintains the room's state and broadcasts important changes to all participants using Socket.IO.

The server acts as the central authority for:

* Room membership
* User roles
* Permissions
* Playback state
* Chat events
* Join requests
* Participant updates

---

# 🎥 YouTube Video Synchronization

The application uses the **YouTube IFrame Player API** to embed and control YouTube videos.

Users can provide a YouTube video URL. The application extracts the required video information and loads the video into the embedded player.

Playback actions are communicated through Socket.IO.

```text
                  Host
                    │
              Play / Pause / Seek
                    │
                    ▼
             Socket.IO Client
                    │
                    ▼
             Socket.IO Server
                    │
                    ▼
               Room State
                    │
             Broadcast Event
                    │
        ┌───────────┴───────────┐
        ▼                       ▼
     User 2                   User 3
```

For example, when the host pauses the video:

```text
Host pauses video
       ↓
Client detects playback event
       ↓
Socket.IO event sent to server
       ↓
Server validates the action
       ↓
Room playback state updated
       ↓
Event broadcast to participants
       ↓
Other users pause their players
```

This allows participants in the same room to maintain a synchronized viewing experience.

---

# 👑 Roles & Permissions

The application follows a role-based permission model.

## 👑 Host

The host is the primary controller of the watch room.

The host can:

* Control shared playback
* Change the current video
* Manage participants
* Handle join requests
* Assign or manage moderator permissions
* Perform host-level room actions

---

## 🛡️ Moderator

A moderator assists the host with room management.

Depending on the configured permissions, moderators can perform selected management actions without having full host authority.

The backend validates moderator actions before applying them to the room.

---

## 👤 Participant

Participants can:

* Watch the shared video
* View other participants
* Use real-time chat
* Interact with the room
* Send requests for restricted actions

Actions requiring elevated permissions remain controlled by the room's permission system.

---

## 👀 Viewer

Viewers can participate in the watch party and watch the shared content while restricted actions remain controlled by the room's permissions.

---

# 💬 Real-Time Chat

The application includes a real-time room-based chat system powered by Socket.IO.

```text
User
 │
 ▼
Chat Message
 │
 ▼
Socket.IO Client
 │
 ▼
Socket.IO Server
 │
 ▼
Room
 │
 ├──────────────► User 2
 │
 └──────────────► User 3
```

Messages are delivered to connected participants immediately without requiring a page refresh.

The chat is scoped to the current room, ensuring that messages are only broadcast to participants belonging to that room.

---

# 👥 Room Management

Every watch party is organized around a unique room.

A room maintains information such as:

```text
Room
├── Room ID
├── Host
├── Participants
│   ├── User ID
│   ├── Username
│   ├── Role
│   ├── Join Time
│   └── Connection Status
├── Current Video
├── Playback State
├── Chat
├── Join Requests
├── Created At
└── Updated At
```

The **Room Manager** is responsible for maintaining room-level state and coordinating participant and playback events.

---

# 🔄 Real-Time Communication

**Socket.IO** is the core real-time communication layer of the application.

It is used for:

* Room creation and joining
* Participant updates
* Playback synchronization
* Play/pause events
* Seek events
* Video changes
* Chat messages
* Join requests
* Role updates
* Room state changes

The architecture allows connected users to receive updates immediately rather than repeatedly requesting the latest state from the server.

---

# 🛡️ Role-Based Authorization

The application does not rely only on the frontend to restrict actions.

Restricted operations are validated on the **backend** before modifying the shared room state.

```text
Client Request
      │
      ▼
Socket.IO Server
      │
      ▼
Identify User
      │
      ▼
Check Room Membership
      │
      ▼
Check User Role
      │
      ▼
Validate Permission
      │
   ┌──┴──┐
   │     │
 Allow  Reject
   │     │
   ▼     ▼
Update  Error
Room    Response
State
```

This prevents users from gaining additional privileges simply by modifying frontend behavior.

---

# 🗄️ Database

The application uses **MongoDB Atlas** for persistent data storage.

The backend communicates with MongoDB using the **MongoDB Node.js Driver**.

The database stores room-related information such as:

* Room details
* Participants
* User roles
* Playback information
* Room timestamps
* Chat information
* Room activity

MongoDB provides persistence so that room-related information is not dependent entirely on the server's in-memory state.

---

# 🏗️ System Architecture

```text
                         ┌──────────────────┐
                         │      Users       │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ React + Vite     │
                         │    Frontend      │
                         └────────┬─────────┘
                                  │
                         Socket.IO / HTTP
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ Node.js +        │
                         │ Express +        │
                         │ Socket.IO        │
                         └────────┬─────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
             ┌─────────────┐             ┌─────────────┐
             │ Room Manager│             │ Permissions │
             └──────┬──────┘             └─────────────┘
                    │
                    ▼
             ┌─────────────┐
             │   MongoDB   │
             │    Atlas    │
             └─────────────┘
```

---

# 🛠️ Tech Stack

## Frontend

* React
* Vite
* JavaScript
* CSS
* Socket.IO Client
* YouTube IFrame Player API

## Backend

* Node.js
* Express.js
* Socket.IO
* JavaScript

## Database

* MongoDB
* MongoDB Atlas
* MongoDB Node.js Driver

## Deployment

* Vercel — Frontend
* Render — Backend
* MongoDB Atlas — Database

## Development Tools

* Git
* GitHub
* VS Code
* Postman

---

# 📁 Project Structure

```text
Watch-Partyy/
│
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Chat.jsx
│   │   │   ├── Landing.jsx
│   │   │   ├── People.jsx
│   │   │   ├── Player.jsx
│   │   │   ├── Requests.jsx
│   │   │   └── Room.jsx
│   │   │
│   │   ├── lib/
│   │   │   └── youtube.js
│   │   │
│   │   ├── App.jsx
│   │   ├── hooks.js
│   │   ├── main.jsx
│   │   ├── socket.js
│   │   └── styles.css
│   │
│   └── package.json
│
├── server/
│   ├── src/
│   │   ├── models/
│   │   │   ├── Participant.js
│   │   │   ├── Room.js
│   │   │   └── RoomManager.js
│   │   │
│   │   ├── SocketHandler.js
│   │   ├── app.js
│   │   ├── database.js
│   │   ├── errors.js
│   │   ├── index.js
│   │   ├── permissions.js
│   │   └── utils.js
│   │
│   ├── test/
│   └── package.json
│
├── docs/
│   └── EXPLAIN.md
│
├── .env.example
├── package.json
├── render.yaml
└── README.md
```

---

# ▶️ Run Locally

## 1. Clone the Repository

```bash
git clone https://github.com/Shloksharma0505/Watch-Partyy.git
cd Watch-Partyy
```

## 2. Install Dependencies

```bash
npm run install:all
```

## 3. Configure Environment Variables

Create the required environment variables for the backend.

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=youtube_watch_party
CLIENT_ORIGIN=http://localhost:5173
```

> Do not commit actual database credentials or private environment variables to GitHub.

## 4. Start the Backend

```bash
npm run dev:server
```

## 5. Start the Frontend

Open another terminal and run:

```bash
npm run dev:client
```

The application will normally be available at:

```text
http://localhost:5173
```

---

# ☁️ Deployment Architecture

The application uses a separate frontend and backend deployment architecture.

```text
                         GitHub
                           │
              ┌────────────┴────────────┐
              │                         │
              ▼                         ▼
           Vercel                    Render
              │                         │
              ▼                         ▼
        React + Vite             Node + Express
                                        │
                                        ▼
                                  Socket.IO
                                        │
                                        ▼
                                 MongoDB Atlas
```

### Frontend — Vercel

The React/Vite frontend is deployed using Vercel.

### Backend — Render

The Node.js, Express.js and Socket.IO server is deployed using Render.

### Database — MongoDB Atlas

MongoDB Atlas is used for persistent room-related data.

---

# 🔐 Environment Variables

Environment variables are used to separate deployment configuration from application source code.

### Backend

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=youtube_watch_party
CLIENT_ORIGIN=http://localhost:5173
```

For production deployment, these values should be configured through the hosting provider's environment variable settings.

**Never commit:**

* MongoDB passwords
* Database connection strings containing credentials
* API keys
* Private environment variables
* Production secrets

---

# 🧪 Testing & Validation

The application can be validated by testing the following scenarios:

### Room Management

* Create a room
* Join a room
* Join using a shared room link
* Multiple users joining the same room

### Playback

* Play video
* Pause video
* Seek video
* Change video
* Verify synchronization between participants

### Permissions

* Verify host permissions
* Verify moderator permissions
* Verify participant restrictions
* Verify unauthorized actions are rejected

### Real-Time Features

* Send chat messages
* Join and leave rooms
* Update participant list
* Handle join requests
* Verify real-time state updates

### Deployment

* Verify frontend availability
* Verify backend health endpoint
* Verify frontend-backend communication
* Verify MongoDB connectivity

---

# 📚 What This Project Demonstrates

This project demonstrates practical experience with:

* Full-stack web application development
* React component-based architecture
* Node.js and Express.js backend development
* Real-time communication using Socket.IO
* WebSocket-based state synchronization
* Room-based application architecture
* Role-based access control
* Backend permission validation
* YouTube IFrame Player API integration
* MongoDB persistence
* REST API concepts
* CORS configuration
* Environment variable management
* Responsive UI development
* Git and GitHub
* Production deployment using Vercel and Render

---

# 💡 Key Technical Highlights

### Real-Time State Synchronization

Instead of relying on continuous polling, the application uses Socket.IO events to distribute important state changes between users.

### Centralized Room State

The backend maintains the shared room state, allowing participants to receive a consistent view of the current room.

### Permission Validation

Sensitive operations are validated on the backend according to the user's role.

### Event-Driven Architecture

Actions such as playback changes, chat messages, participant updates and requests are handled through real-time events.

### Persistent Storage

MongoDB provides persistent storage for room information and related data.

---

# 👨‍💻 Author

## Shlok Sharma

**Full Stack Developer**

Built using:

**React • Node.js • Express.js • Socket.IO • MongoDB**

### GitHub

https://github.com/Shloksharma0505

### Project Repository

https://github.com/Shloksharma0505/Watch-Partyy

---

# 📄 License

This project was created for **educational, internship and project demonstration purposes**.
