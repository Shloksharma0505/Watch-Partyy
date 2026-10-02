import { useState } from 'react';
import Landing from './components/Landing.jsx';
import Room from './components/Room.jsx';

const roomFromPath = () => {
  const m = window.location.pathname.match(/^\/room\/([A-Za-z0-9]+)/);
  return m ? m[1].toUpperCase() : '';
};

export default function App() {
  const [session, setSession] = useState(null);
  const [notice, setNotice] = useState('');

  const start = (s) => {
    setNotice('');
    setSession(s);
  };
  const exit = (msg = '') => {
    if (window.location.pathname !== '/') window.history.replaceState({}, '', '/');
    setSession(null);
    setNotice(msg);
  };

  if (session) {
    return <Room key={`${session.mode}-${session.roomId}-${session.username}`} session={session} onExit={exit} />;
  }
  return <Landing linkedRoom={roomFromPath()} notice={notice} onStart={start} />;
}
