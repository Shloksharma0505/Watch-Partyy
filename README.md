# 🎬 Watch Party

> A real-time YouTube Watch Party application that allows multiple users to watch YouTube videos together in synchronized rooms.

Watch Party is a full-stack real-time web application where users can create or join a shared room, watch YouTube videos together, communicate through real-time chat, and stay synchronized during playback.

---

## 🚀 Live Demo

### 🌐 Live Application

**https://watch-partyy-client-1226.vercel.app**

### 💻 GitHub Repository

**https://github.com/Shloksharma0505/Watch-Partyy**

---

## ✨ Features

- 🎬 Create and join watch rooms
- 🔗 Shareable room links
- ▶️ Real-time YouTube playback synchronization
- ⏸️ Play / Pause synchronization
- ⏩ Seek synchronization
- 🎥 Real-time video change synchronization
- 👑 Host-controlled playback
- 👥 Real-time participant updates
- 💬 Real-time chat
- 🙋 Join request handling
- 🛡️ Role-based permissions
- 🔄 Participant and room management
- ⚡ Real-time communication using Socket.IO
- 🗄️ MongoDB-based room persistence
- 📱 Responsive user interface
- ☁️ Public deployment using Vercel and Render

---

# 🏗️ Architecture Overview

The application follows a client-server architecture where **Socket.IO/WebSockets** provide real-time communication between users and the backend.


                    ┌──────────────────┐
                    │      Users       │
                    │ Desktop / Mobile │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Vercel Frontend  │
                    │ React + Vite     │
                    └────────┬─────────┘
                             │
                        Socket.IO
                       Real-Time Data
                             │
                             ▼
                    ┌──────────────────┐
                    │ Render Backend   │
                    │ Node + Express   │
                    │    Socket.IO     │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │   Room Manager   │
                    │                  │
                    │ Participants     │
                    │ Roles            │
                    │ Playback State   │
                    │ Chat             │
                    │ Requests         │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │  MongoDB Atlas   │
                    │ Persistent Data  │
                    └──────────────────┘
⚡ WebSocket / Real-Time Flow

Socket.IO is used to keep all participants synchronized in real time.

For example, when the host pauses the video:

Host
 │
 │ Pause Event
 ▼
Socket.IO Client
 │
 ▼
Socket.IO Server
 │
 ▼
Room Manager
 │
 │ Update Room State
 ▼
Broadcast Event
 │
 ├──────────────► Participant 1
 │
 ├──────────────► Participant 2
 │
 └──────────────► Participant 3

The same mechanism is used for:

Play
Pause
Seek
Video change
Participant updates
Chat messages
Join requests
Role changes
Room state updates
🎥 YouTube Video Flow

The application uses the YouTube IFrame Player API to play YouTube videos inside the watch room.

Users provide a YouTube video URL.

YouTube URL
     │
     ▼
Extract Video ID
     │
     ▼
YouTube IFrame Player
     │
     ▼
Playback Event
     │
     ▼
Socket.IO
     │
     ▼
Server Room State
     │
     ▼
Other Participants

This allows multiple users in the same room to watch the same YouTube video together.

👑 Roles & Permissions

The watch room supports different participant roles.

Host

The host is responsible for controlling the shared room and managing participants.

Moderator

The moderator can perform the actions permitted by the application's role system.

Participant

Participants can watch the video, communicate through chat and request restricted actions.

Viewer

Viewers can participate in watching the shared content while restricted actions remain controlled by the room permissions.

The backend validates restricted actions before modifying the shared room state.

💬 Real-Time Chat

Users can communicate with other participants through the room chat.

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
 ▼
Broadcast
 │
 ├──────────► User 2
 │
 └──────────► User 3

Messages are delivered to connected participants in real time without refreshing the page.

👥 Room Flow
User
 │
 ▼
Create Room / Join Room
 │
 ▼
Connect to Socket.IO
 │
 ▼
Enter Watch Room
 │
 ▼
Load YouTube Video
 │
 ▼
Watch Together
 │
 ├── Playback Sync
 ├── Chat
 ├── Participant Updates
 └── Requests

When a room is created, the creator becomes the host. Other users can join using the room link.

The backend maintains the room state and broadcasts changes to connected participants.

🗄️ Database

MongoDB Atlas is used for persistent storage.

The application stores room-related information such as:

Room
│
├── Room ID
│
├── Playback State
│   ├── Video
│   ├── Playing / Paused
│   └── Current Position
│
├── Participants
│   ├── User ID
│   ├── Username
│   ├── Role
│   ├── Join Time
│   └── Connection Status
│
├── Chat
│
├── Created At
│
└── Updated At

The database layer is implemented using the MongoDB Node.js driver.


📁 Project Structure
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
⚙️ Local Setup
1. Clone the Repository
git clone https://github.com/Shloksharma0505/Watch-Partyy.git

cd Watch-Partyy
2. Install Dependencies
npm run install:all

Or install manually:

cd client
npm install

cd ../server
npm install
🔐 Environment Variables

Create a .env file inside the server directory.

Example:

MONGODB_URI=your_mongodb_connection_string
MONGODB_DB=youtube_watch_party
CLIENT_ORIGIN=http://localhost:5173

For production, configure the required environment variables directly on Render.

Never commit database credentials or private environment variables to GitHub.

▶️ Run the Application Locally
Start Backend

From the project root:

npm run dev:server

The backend runs on:

http://localhost:3001
Start Frontend

Open another terminal:

npm run dev:client

The frontend runs on:

http://localhost:5173
☁️ Deployment

The application is publicly deployed using Vercel and Render.

                         GitHub
                           │
                ┌──────────┴──────────┐
                ▼                     ▼
             Vercel                 Render
                │                     │
                ▼                     ▼
         React + Vite          Node + Express
                                      │
                                      ▼
                                MongoDB Atlas
Frontend

The React/Vite frontend is deployed on Vercel.

Backend

The Node.js, Express and Socket.IO backend is deployed on Render.

Database

MongoDB Atlas is used for persistent room data.

🧪 Application Verification

The deployed application can be verified through the following:

Create a room
Join the room from another browser/device
Load a YouTube video
Test Play/Pause synchronization
Test seeking
Change the YouTube video
Send chat messages
Check participant updates
Test role-based permissions
Verify MongoDB room persistence
📚 Code Walkthrough

The project is structured so that the main application logic can be explained through the following components:

Frontend
React components manage the user interface.
Player.jsx handles the YouTube player.
Chat.jsx manages real-time chat UI.
People.jsx displays participants.
Requests.jsx handles room requests.
socket.js manages Socket.IO communication.
Backend
index.js starts the server.
app.js configures the Express application.
SocketHandler.js manages real-time socket events.
RoomManager.js manages room state.
permissions.js handles role-based authorization.
database.js provides MongoDB persistence.
Real-Time Logic

The backend receives events from connected clients, validates permissions, updates the room state and broadcasts the resulting state to the relevant participants.

🎯 Key Learning Areas

This project demonstrates practical experience with:

Full-stack web development
React component architecture
Node.js backend development
Express.js
Socket.IO / WebSockets
Real-time state synchronization
Room-based architecture
Role-based permissions
YouTube IFrame Player API
MongoDB persistence
CORS
Environment variables
Git and GitHub
Vercel deployment
Render deployment
👨‍💻 Author
Shlok Sharma

Full Stack Developer

Built using:

React • Node.js • Express.js • Socket.IO • MongoDB

GitHub

https://github.com/Shloksharma0505

Project Repository

https://github.com/Shloksharma0505/Watch-Partyy

📄 License

This project was created for educational, internship and project demonstration purposes.
