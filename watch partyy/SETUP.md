# Watch Party - Setup Guide

## 1. Requirements
- Node.js 18+ (20+ recommended)
- npm
- MongoDB Atlas account (optional for local in-memory mode; recommended for persistent rooms)

## 2. Install everything
From the project root:

```powershell
npm run install:all
```

This installs both the server and client dependencies. The server now includes the MongoDB driver and dotenv.

## 3. Configure MongoDB (recommended)
1. Create a free MongoDB Atlas cluster.
2. Create a database user and password.
3. Add your current IP under Network Access (for local development). For Render, allow the Render service to reach Atlas according to Atlas network settings.
4. Copy `.env.example` to `server/.env`.
5. Set:

```env
MONGODB_URI=mongodb+srv://USERNAME:PASSWORD@CLUSTER.mongodb.net/?retryWrites=true&w=majority
MONGODB_DB=youtube_watch_party
```

Do not commit `server/.env` to GitHub. `.gitignore` should keep local secrets out of the repository.

If `MONGODB_URI` is missing, the application still runs with in-memory room state.

## 4. Run locally
Open two PowerShell terminals in the project root.

Terminal 1:

```powershell
npm run dev:server
```

Terminal 2:

```powershell
npm run dev:client
```

Open:

```text
http://localhost:5173
```

## 5. Use the app
1. Click **Host a room** and enter your display name.
2. Create the room.
3. In the room, paste a YouTube URL into the video field and click **Change video**.
4. Copy the invite link.
5. Open the link in an incognito window or another browser and join with another name.
6. Host/moderator can play, pause, seek and change the video.
7. Participants can send requests; the host/moderator can approve or decline them.
8. The People panel contains role management, moderator promotion, host transfer and participant removal.
9. Chat and emoji reactions are available as bonus features.

Example YouTube URL:

```text
https://www.youtube.com/watch?v=dQw4w9WgXcQ
```

The application extracts the YouTube video ID and loads it through the YouTube IFrame API.

## 6. Production build locally

```powershell
npm run build
npm start
```

Then open:

```text
http://localhost:3001
```

## 7. Render deployment
Use the existing `render.yaml`.

Set these Render environment variables:

```text
MONGODB_URI=<your MongoDB Atlas connection string>
MONGODB_DB=youtube_watch_party
```

After deployment, put the real Render URL in `README.md` where the placeholder live demo URL is shown.

## 8. Important notes
- Only embeddable/public YouTube videos can play inside the iframe. Some videos disable embedding.
- Browser autoplay policies can require a user click before playback with sound.
- MongoDB persists room state, participants/roles and recent chat. Active Socket.IO connections are still real-time and live in memory.
- If MongoDB is not configured, rooms are temporary and disappear when the server restarts.
