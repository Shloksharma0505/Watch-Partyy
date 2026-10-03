# 🎬 Watch Party

> A real-time YouTube Watch Party application that allows multiple users to watch YouTube videos together in synchronized rooms.

**Watch Party** is a full-stack real-time web application where users can create or join a shared room and watch YouTube videos together. The application keeps video playback synchronized between participants and provides real-time communication and room management features.

---

## 🚀 Live Demo

### 🌐 Live Application

**[Watch Party – Live Demo](https://watch-partyy-client-1226.vercel.app)**

### 💻 GitHub Repository

**[Watch-Partyy](https://github.com/Shloksharma0505/Watch-Partyy)**

---

## ✨ Features

* 🎬 Create and join watch rooms
* 🔗 Shareable room links
* ▶️ Synchronized YouTube playback
* ⏸️ Play / Pause synchronization
* ⏩ Seek synchronization
* 🎥 Change YouTube videos in real time
* 👑 Host-controlled playback
* 👥 Real-time participant list
* 💬 Real-time chat
* 🙋 Join request handling
* 🛡️ Role-based permissions
* 🔄 Host and participant management
* ⚡ Real-time updates using Socket.IO
* 🗄️ MongoDB-based room persistence
* 📱 Responsive user interface
* ☁️ Production deployment using Vercel and Render

---

## 🧠 How It Works

The application follows a simple real-time room-based architecture:

```text
User
  │
  ▼
Create / Join Room
  │
  ▼
React Frontend
  │
  │ Socket.IO
  ▼
Node.js + Express Server
  │
  ▼
Room Manager
  │
  ├── Participants
  ├── Roles & Permissions
  ├── Playback State
  ├── Chat
  └── Requests
  │
  ▼
MongoDB
```

When a user creates a room, a unique room is created and the user becomes the host. Other users can join the room using the shared room link.

Once participants are connected, the server maintains the room state and broadcasts important changes to all connected users.

---

## 🎥 YouTube Video Synchronization

Users watch YouTube videos directly through the embedded YouTube player.

The application accepts a **YouTube video URL**, extracts the video information and loads it into the YouTube IFrame Player.

Playback actions such as:

* Play
* Pause
* Seek
* Video change

are sent through Socket.IO and synchronized with the other participants.

```text
Host
 │
 │ Play / Pause / Seek
 ▼
Socket.IO Client
 │
 ▼
Socket.IO Server
 │
 ▼
Room State
 │
 ▼
Broadcast to Participants
 │
 ├──────────────► User 2
 │
 └──────────────► User 3
```

This allows everyone in the room to stay on the same video and playback position.

---

## 👑 Roles & Permissions

The application uses role-based access within a watch room.

### Host

The host has the highest level of control over the room and can manage participants and shared playback.

### Moderator

A moderator can assist with room management and perform the permissions allowed by the application.

### Participant

Participants can watch the video, communicate through chat and request restricted actions where required.

### Viewer

Viewers can participate in watching the shared video while restricted actions remain controlled by the room's permissions.

The backend validates restricted actions before applying changes to the shared room state.

---

## 💬 Real-Time Chat

Participants can communicate using the built-in real-time chat.

```text
User
 │
 ▼
Chat Message
 │
 ▼
Socket.IO
 │
 ▼
Server
 │
 ▼
Room
 │
 ▼
Other Participants
```

Messages are delivered to connected users without requiring a page refresh.

---

## 👥 Room Management

Each watch party is organized around a room.

A room contains information such as:

* Room ID
* Participants
* User roles
* Current YouTube video
* Playback state
* Chat messages
* Room activity

The server acts as the central authority for room state and real-time synchronization.

---

## 🗄️ Database

MongoDB is used to persist room information.

The application uses the MongoDB Node.js driver to communicate with MongoDB Atlas.

Stored room information includes:

```text
Room
├── Room ID
├── Playback State
├── Participants
│   ├── User ID
│   ├── Username
│   ├── Role
│   ├── Join Time
│   └── Connection Status
├── Chat
├── Created At
└── Updated At
```

MongoDB allows room information to persist beyond the application's in-memory state.

---

## ⚡ Real-Time Communication

**Socket.IO** is used as the real-time communication layer between the frontend and backend.

It handles:

* Room events
* Participant updates
* Playback synchronization
* Chat messages
* Join requests
* Role updates
* Room state changes

This provides instant updates between users connected to the same watch room.

---

## 🛠️ Tech Stack

### Frontend

* React
* Vite
* JavaScript
* CSS
* YouTube IFrame Player API
* Socket.IO Client

### Backend

* Node.js
* Express.js
* Socket.IO
* JavaScript

### Database

* MongoDB
* MongoDB Atlas
* MongoDB Node.js Driver

### Deployment

* Vercel — Frontend
* Render — Backend
* MongoDB Atlas — Database

### Version Control

* Git
* GitHub

---

## 📁 Project Structure

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

## ▶️ Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/Shloksharma0505/Watch-Partyy.git
cd Watch-Partyy
```

### 2. Install dependencies

```bash
npm run install:all
```

### 3. Configure environment variables

Create the required environment variables for the backend.

Example:

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=youtube_watch_party
CLIENT_ORIGIN=http://localhost:5173
```

### 4. Start the backend

```bash
npm run dev:server
```

### 5. Start the frontend

Open another terminal:

```bash
npm run dev:client
```

The application will normally be available at:

```text
http://localhost:5173
```

---

## ☁️ Deployment

The project uses a separate frontend and backend deployment architecture.

```text
                    GitHub
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
          Vercel              Render
             │                   │
             ▼                   ▼
        React + Vite      Node + Express
                                 │
                                 ▼
                           MongoDB Atlas
```

### Frontend

The React/Vite frontend is deployed on **Vercel**.

### Backend

The Node.js, Express and Socket.IO backend is deployed on **Render**.

### Database

Room persistence is handled through **MongoDB Atlas**.

---

## 🔐 Environment Variables

Environment variables are used to keep deployment-specific configuration outside the source code.

Example:

```env
MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=youtube_watch_party
CLIENT_ORIGIN=http://localhost:5173
```

For production, configure the appropriate values directly in the hosting platform.

> Never commit passwords, database credentials or private environment variables to GitHub.

---

## 📚 What This Project Demonstrates

This project demonstrates practical experience with:

* Full-stack web development
* React component-based development
* REST and server-side application structure
* Real-time communication with Socket.IO
* WebSocket-based state synchronization
* Room-based application architecture
* Role-based permissions
* YouTube IFrame Player integration
* MongoDB persistence
* CORS configuration
* Environment variables
* Responsive UI development
* Git and GitHub
* Vercel and Render deployment

---

## 👨‍💻 Author

### Shlok Sharma

**Full Stack Developer**

Built with:

**React • Node.js • Express.js • Socket.IO • MongoDB**

**GitHub:**
https://github.com/Shloksharma0505

**Project:**
https://github.com/Shloksharma0505/Watch-Partyy


---

<p align="center">
  🎬 <strong>Watch together. Stay synchronized.</strong>
</p>
