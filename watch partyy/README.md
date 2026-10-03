&#x20;Watch Party



A real-time YouTube Watch Party application that allows multiple users to watch YouTube videos together in synchronized rooms.



Users can create or join a room, watch videos together, chat with other participants, and stay synchronized when the host changes the video, pauses, plays, or seeks.



&#x20;Live Demo



Frontend:

https://watch-partyy-client-1226.vercel.app



\*\*Backend Health Check:\*\*

https://watch-partyy.onrender.com/health



\*\*GitHub Repository:\*\*

https://github.com/Shloksharma0505/Watch-Partyy



\---



\## Features



\* Create and join watch rooms

\* Unique room links

\* Real-time YouTube video synchronization

\* Play / Pause synchronization

\* Seek synchronization

\* Video change synchronization

\* Host-controlled playback

\* Room-based user management

\* Real-time participant updates

\* Real-time chat

\* People/participant list

\* Join request handling

\* Host permissions

\* Automatic room heartbeat and cleanup

\* Responsive UI for desktop and mobile

\* YouTube embedded player

\* Production deployment with Vercel and Render



\---



\## Tech Stack



\### Frontend



\* React

\* Vite

\* JavaScript

\* CSS

\* YouTube IFrame Player API

\* Socket.IO Client



\### Backend



\* Node.js

\* Express.js

\* Socket.IO

\* JavaScript



\### Deployment



\* Vercel — Frontend

\* Render — Backend



\### Version Control



\* Git

\* GitHub



\---



\## Architecture



```text

&#x20;                   ┌──────────────────────┐

&#x20;                   │       User           │

&#x20;                   │  Desktop / Mobile    │

&#x20;                   └──────────┬───────────┘

&#x20;                              │

&#x20;                              ▼

&#x20;                   ┌──────────────────────┐

&#x20;                   │       Vercel         │

&#x20;                   │   React + Vite       │

&#x20;                   │      Frontend        │

&#x20;                   └──────────┬───────────┘

&#x20;                              │

&#x20;                        Socket.IO

&#x20;                              │

&#x20;                              ▼

&#x20;                   ┌──────────────────────┐

&#x20;                   │       Render         │

&#x20;                   │ Node.js + Express    │

&#x20;                   │      Socket.IO       │

&#x20;                   └──────────┬───────────┘

&#x20;                              │

&#x20;                              ▼

&#x20;                   ┌──────────────────────┐

&#x20;                   │     Room Manager     │

&#x20;                   │                      │

&#x20;                   │ Rooms / Participants │

&#x20;                   │ Sync / Permissions   │

&#x20;                   └──────────────────────┘

```



\---



\## How It Works



1\. A user opens the Watch Party application.

2\. The user creates a new room.

3\. The application generates a unique room ID.

4\. Other users join using the room link.

5\. Users connect to the backend using Socket.IO.

6\. The server manages room participants and permissions.

7\. The host controls the synchronized YouTube player.

8\. Playback events are broadcast to other participants.

9\. Participants receive the updated player state in real time.

10\. Chat and participant updates are also synchronized through Socket.IO.



\---



\## Real-Time Synchronization



The application synchronizes important YouTube player events including:



\* Play

\* Pause

\* Seek

\* Video change

\* Current playback position



Example flow:



```text

Host

&#x20; │

&#x20; │ Play / Pause / Seek

&#x20; ▼

Socket.IO Client

&#x20; │

&#x20; ▼

Socket.IO Server

&#x20; │

&#x20; ▼

Room Manager

&#x20; │

&#x20; ├──────────────┐

&#x20; ▼              ▼

User 2          User 3

&#x20; │              │

&#x20; ▼              ▼

Player Sync     Player Sync

```



\---



\## Project Structure



```text

watch partyy/

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

│   ├── package.json

│   └── vite.config.js

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



\---



\## Local Setup



\### 1. Clone the repository



```bash

git clone https://github.com/Shloksharma0505/Watch-Partyy.git

cd Watch-Partyy

```



\### 2. Install dependencies



Install root dependencies:



```bash

npm install

```



Install client dependencies:



```bash

cd client

npm install

```



Install server dependencies:



```bash

cd ../server

npm install

```



\### 3. Configure Environment Variables



Create the required environment file using the provided example:



```text

.env.example

```



For the production frontend/backend split deployment, the backend needs the frontend origin configured.



Example:



```env

CLIENT\_ORIGIN=http://localhost:5173

```



For production:



```env

CLIENT\_ORIGIN=https://watch-partyy-client-1226.vercel.app

```



Do not commit private API keys, passwords, database credentials, or secret environment variables to GitHub.



\---



\## Running Locally



\### Start Backend



From the `server` directory:



```bash

npm start

```



\### Start Frontend



Open another terminal and run:



```bash

cd client

npm run dev

```



The frontend will normally be available at:



```text

http://localhost:5173

```



The backend runs on the configured server port.



\---



\## Environment Variables



The project uses environment variables so deployment-specific configuration is not hardcoded into the application.



Example:



```env

CLIENT\_ORIGIN=http://localhost:5173

```



For production, configure environment variables directly in the hosting platform.



Never upload an actual `.env` file containing secrets.



\---



\## Deployment



\### Frontend



The React/Vite frontend is deployed on Vercel.



```text

GitHub

&#x20;  ↓

Vercel

&#x20;  ↓

React + Vite

```



\### Backend



The Node.js/Express/Socket.IO backend is deployed on Render.



```text

GitHub

&#x20;  ↓

Render

&#x20;  ↓

Node.js + Express + Socket.IO

```



\---



\## Production Flow



```text

User

&#x20;│

&#x20;▼

Vercel Frontend

&#x20;│

&#x20;│ Socket.IO

&#x20;▼

Render Backend

&#x20;│

&#x20;▼

Room Manager

&#x20;│

&#x20;├── Host

&#x20;├── Participants

&#x20;├── Playback State

&#x20;└── Chat

```



\---



\## Key Learning Areas



This project demonstrates practical implementation of:



\* React component architecture

\* Vite-based frontend development

\* Node.js backend development

\* Express server configuration

\* WebSocket communication

\* Socket.IO

\* Real-time state synchronization

\* Room-based application architecture

\* Host permissions

\* YouTube IFrame Player API

\* CORS configuration

\* Environment variables

\* Git and GitHub

\* Vercel deployment

\* Render deployment



\---



\## Future Improvements



Possible future improvements include:



\* Persistent room storage

\* User authentication

\* Advanced moderation controls

\* Redis-based Socket.IO scaling

\* Horizontal backend scaling

\* Better reconnection handling

\* Room persistence

\* Improved analytics

\* Voice/video communication

\* More synchronization controls



\---



\## Author



Shlok Sharma



GitHub:

https://github.com/Shloksharma0505



\---



\## License



This project is created for educational and internship/project demonstration purposes.



